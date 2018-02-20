import { parse, print, ExecutableDefinitionNode, FragmentDefinitionNode, DocumentNode, SelectionSetNode, FieldNode, InlineFragmentNode, VariableDefinitionNode } from 'graphql'

// @ts-ignore
import * as paramCase from 'param-case'

export interface FragmentMetadata extends OperationMeteadata {
    onType?: string
}

export interface OperationMeteadata {
    name: string
    dependsOn: Set<string>
    body: string
    dependencyKeyMap: { [name: string]: string }
    variables: { [variable: string]: string }
}

export interface Metadata {
    fragments: { [key: string]: FragmentMetadata }
    operations: { [key: string]: OperationMeteadata }
}

export const metadata: Metadata = {
    fragments: {},
    operations: {}
}

const fragmentMap = new Map<string, ExecutableNode>()
const operationsMap = new Map<string, ExecutableNode>()
const nodeMap = new Map<string, ExecutableNode>()

function parseSelectionSet(selectionSet: SelectionSetNode, dependenciesMap: { [key: string]: ExecutableDefinitionNode }) {
    selectionSet.selections = [].concat(
        selectionSet.selections
            .map(selectionObj => {
                if (selectionObj.kind == 'FragmentSpread' && selectionObj.name.value in dependenciesMap) {
                    return dependenciesMap[selectionObj.name.value].selectionSet.selections
                } else {
                    const selection = selectionObj as (FieldNode | InlineFragmentNode)
                    if (selection.selectionSet)
                        selection.selectionSet = parseSelectionSet(selection.selectionSet, dependenciesMap)

                    return [selection]
                }
            })
    )

    return selectionSet
}

function flattenFragments(definition: ExecutableDefinitionNode, dependencies: Set<ExecutableNode>) {
    const dependenciesMap: { [key: string]: ExecutableDefinitionNode } = {}
    dependencies.forEach(dep => dependenciesMap[dep.name] = dep.definition)
    definition.selectionSet = parseSelectionSet(definition.selectionSet, dependenciesMap)
}

function recursiveNodes(node: any, cb: (node) => void) {
    if (!node.kind || !(typeof node === 'object'))
        return

    cb(node)

    Object.keys(node)
        .forEach(key => {
            if (!node[key])
                return

            if (Array.isArray(node[key]))
                return node[key].forEach(el => recursiveNodes(el, cb))

            recursiveNodes(node[key], cb)
        })
}

function setNodeWithuniqueKey(node: ExecutableNode, map: Map<string, ExecutableNode>, prefix = '', unique = false): string {
    let key = prefix.toLowerCase().replace(/[^a-z]/g, '') + '_' + paramCase(node.name)
    if (map.has(key) && map.get(key) !== node) {
        if (unique)
            throw new TypeError(`Found multiple definitions for ${node.name}.`)
        let i = 1
        while (map.has(`${key}-${i}`) && map.get(`${key}-${i}`) !== node)
            i++
        key = `${key}-${i}`
    }
    map.set(key, node)
    return key
}

export function generateNodeMetadata(node: ExecutableNode) {
    const body = print({
        kind: 'Document',
        definitions: [
            node.definition
        ]
    } as DocumentNode)

    const dependencyKeyMap: { [name: string]: string } = {}
    node.dependencies
        .forEach(dep => dependencyKeyMap[dep.name] = dep.key)

    const dependsOn = new Set<string>()
    const variables: { [key: string]: string } = {}
    recursiveNodes(node.definition, (node) => {
        if (node.kind == 'FragmentSpread' && node.name.value in dependencyKeyMap)
            dependsOn.add(dependencyKeyMap[node.name.value])

        if (node.kind == 'VariableDefinition')
            variables[(node as VariableDefinitionNode).variable.name.value] = '...'
    })

    if (node.definition.kind == 'FragmentDefinition')
        metadata.fragments[node.key] = {
            name: node.name,
            body,
            dependsOn,
            dependencyKeyMap,
            onType: (node.definition as FragmentDefinitionNode).typeCondition.name.value,
            variables
        }
    else if (node.definition.kind == 'OperationDefinition')
        metadata.operations[node.key] = {
            name: node.name,
            body,
            dependsOn,
            dependencyKeyMap,
            variables
        }
}

export class ExecutableNode {
    public readonly key: string
    private document: DocumentNode
    private flatDocument: DocumentNode

    constructor(
        public readonly name: string,
        public readonly definition: ExecutableDefinitionNode,
        public readonly dependencies: Set<ExecutableNode>
    ) {
        this.key = paramCase(this.name)

        if (this.definition.kind == 'FragmentDefinition')
            this.key = setNodeWithuniqueKey(this, fragmentMap, 'fragment')
        else if (this.definition.kind == 'OperationDefinition')
            this.key = setNodeWithuniqueKey(this, operationsMap, 'operation', true)

        generateNodeMetadata(this)

        const doc: DocumentNode = {
            kind: 'Document',
            definitions: [
                this,
                ...this.dependencies
            ].map(node => node.definition)
        }
        this.document = parse(print(doc))

        /*flattenFragments(this.definition, this.dependencies)
        const flatDoc: DocumentNode = {
            kind: 'Document',
            definitions: [
                this,
                ...this.dependencies
            ].map(node => node.definition)
        }
        this.flatDocument = parse(print(flatDoc))*/
    }

    toString(flat = false) {
        return print(flat ? this.flatDocument : this.document)
    }

    dispose() {
        if (this.definition.kind == 'FragmentDefinition')
            fragmentMap.delete(this.key)
        else if (this.definition.kind == 'OperationDefinition')
            operationsMap.delete(this.key)
    }
}

export function gqlHMR(module): typeof gql {
    return (parts: TemplateStringsArray, ...captures: ExecutableNode[]) => {
        const node = gql(parts, ...captures)
        if (module.hot)
            module.hot.dispose(() => node.dispose())

        return node
    }
}

export function gql(parts: TemplateStringsArray, ...captures: ExecutableNode[]): ExecutableNode {
    const dependencies = new Set<ExecutableNode>()
    const capturedMap = new Map<string, ExecutableNode>()
    const body = parts.reduce((body, part, i) => {
        body += part
        if (i < captures.length) {
            if (captures[i].definition.kind != 'FragmentDefinition')
                throw new TypeError(`Tempate can only capture fragment definitions, but ${captures[i].definition.kind} was found`)

            if (capturedMap.has(captures[i].name) && capturedMap.get(captures[i].name) !== captures[i])
                throw new TypeError(`Multiple fragments for name ${captures[i].name} found`)

            body += captures[i].name

            capturedMap.set(captures[i].name, captures[i])
            dependencies.add(captures[i])
            captures[i].dependencies
                .forEach(dep => {
                    if (capturedMap.has(dep.name) && capturedMap.get(dep.name) !== dep)
                        throw new TypeError(`Multiple fragments for name ${dep.name} found`)

                    dependencies.add(dep)
                    capturedMap.set(dep.name, dep)
                })
        }
        return body
    }, '')

    const defintions = parse(body).definitions
    if (
        defintions.length != 1
        || (defintions[0].kind != 'OperationDefinition' && defintions[0].kind != 'FragmentDefinition')
        || !defintions[0]['name']
        || !defintions[0]['name'].value
    )
        throw new TypeError("Template should only contain a single named ExecutableDefinitionNode")

    // Make sure calls with identical signature return the samme node
    const cont = print({
        kind: 'Document',
        definitions: [
            defintions[0]
        ]
    } as DocumentNode)
    if (nodeMap.has(cont)) {
        const existingNode = nodeMap.get(cont)
        let equalDeps = true
        try {
            dependencies.forEach(dep => {
                if (!existingNode.dependencies.has(dep)) {
                    equalDeps = false
                    throw new Error()
                }
            })
            existingNode.dependencies.forEach(dep => {
                if (!dependencies.has(dep)) {
                    equalDeps = false
                    throw new Error()
                }
            })
        } catch (e) { }
        if (equalDeps)
            return existingNode
    }

    const node = new ExecutableNode(defintions[0]['name'].value, defintions[0] as ExecutableDefinitionNode, dependencies)
    nodeMap.set(cont, node)
    return node
}