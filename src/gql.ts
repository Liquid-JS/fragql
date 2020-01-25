import { buildSchema, DocumentNode, ExecutableDefinitionNode, FragmentDefinitionNode, GraphQLSchema, parse, print, validate, VariableDefinitionNode } from 'graphql'
import { paramCase } from 'param-case'
import { flatten, recursiveNodes } from './utils'
import { validationRules } from './utils/rules'

export interface OperationMeteadata {
    name: string
    dependsOn: Set<string>
    body: string
    dependencyKeyMap: { [name: string]: string }
    variables: { [variable: string]: string }
    str?: string
}

export interface FragmentMetadata extends OperationMeteadata {
    onType?: string
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
let schema: GraphQLSchema

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

/**
 * Load graphql schema from string, and use it to validate queries
 *
 * @param source graphql schema or string containing schema definition
 */
export function loadSchema(source: string | GraphQLSchema) {
    if (typeof source === 'string')
        try {
            schema = buildSchema(source)
        } catch (_err) {
            schema = undefined
        }
    else if (source instanceof GraphQLSchema)
        schema = source

    if (schema) {
        const errors = new Array<Error>()
        fragmentMap.forEach(node => errors.concat(node.validate()))
        operationsMap.forEach(node => errors.concat(node.validate()))
        return errors
    }
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
    recursiveNodes(node.definition, (childNode) => {
        if (childNode.kind == 'FragmentSpread' && childNode.name.value in dependencyKeyMap)
            dependsOn.add(dependencyKeyMap[childNode.name.value])

        if (childNode.kind == 'VariableDefinition')
            variables[(childNode as VariableDefinitionNode).variable.name.value] = '...'
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
        public readonly dependencies: Set<ExecutableNode>,
        private readonly stack?: string[]
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

        const flatDoc = parse(print(doc))
        flatten(flatDoc)
        this.flatDocument = parse(print(flatDoc))

        const str = this.toString()
        if (this.definition.kind == 'FragmentDefinition')
            metadata.fragments[this.key].str = str
        else if (this.definition.kind == 'OperationDefinition')
            metadata.operations[this.key].str = str

        if (schema) {
            const errors = this.validate()
            if (errors.length)
                throw errors[0]
        }
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

    validate() {
        return validate(schema, this.document, validationRules)
            .map(error => {
                const err = new Error(error.message)
                if (this.stack)
                    err.stack = err.stack
                        .split('\n')
                        .filter((_e, i) => i < 1)
                        .concat(this.stack)
                        .join('\n')

                return err
            })
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
    const body = parts.reduce((joined, part, i) => {
        joined += part
        if (i < captures.length) {
            if (captures[i].definition.kind != 'FragmentDefinition')
                throw new TypeError(`Tempate can only capture fragment definitions, but ${captures[i].definition.kind} was found`)

            if (capturedMap.has(captures[i].name) && capturedMap.get(captures[i].name) !== captures[i])
                throw new TypeError(`Multiple fragments for name ${captures[i].name} found`)

            joined += captures[i].name

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
        return joined
    }, '')

    const defintions = parse(body).definitions
    if (
        defintions.length != 1
        || (defintions[0].kind != 'OperationDefinition' && defintions[0].kind != 'FragmentDefinition')
        || !defintions[0]['name']
        || !defintions[0]['name'].value
    )
        throw new TypeError('Template should only contain a single named ExecutableDefinitionNode')

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

    const stack = new Error().stack
        .split('\n')
        .filter((_e, i) => i > 1)

    const node = new ExecutableNode(defintions[0]['name'].value, defintions[0] as ExecutableDefinitionNode, dependencies, stack)
    nodeMap.set(cont, node)
    return node
}
