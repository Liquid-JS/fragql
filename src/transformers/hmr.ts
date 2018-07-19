import * as ts from 'typescript'

const MODULE_NAME = '@liquid-js/fragql'
const TAG_IMPORT = 'gql'
const HMR_FACTORY_IMPORT = 'gqlHMR'

export default (context: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
    return function transformSourceFile(source: ts.SourceFile) {
        if (source.isDeclarationFile) {
            return source
        }

        function visitor(node: ts.Node): ts.VisitResult<ts.Node> {
            if (ts.isImportDeclaration(node) && (node as ts.ImportDeclaration).moduleSpecifier['text'].indexOf(MODULE_NAME) >= 0) {
                let originalName = ''
                let hasHMRImport = false

                node.importClause.namedBindings['elements'].forEach((importNode: ts.ImportSpecifier) => {
                    if (hasHMRImport)
                        return

                    if (importNode.propertyName && importNode.propertyName.escapedText == HMR_FACTORY_IMPORT)
                        return hasHMRImport = true

                    if (!importNode.propertyName && importNode.name.escapedText == HMR_FACTORY_IMPORT)
                        return hasHMRImport = true

                    if (importNode.propertyName && importNode.propertyName.escapedText == TAG_IMPORT) {
                        originalName = importNode.name.escapedText + ''
                        importNode.propertyName = ts.createIdentifier(HMR_FACTORY_IMPORT)
                        importNode.name = ts.createIdentifier(originalName + '$$')
                    } else if (!importNode.propertyName && importNode.name.escapedText == TAG_IMPORT) {
                        originalName = importNode.name.escapedText + ''
                        importNode.propertyName = ts.createIdentifier(HMR_FACTORY_IMPORT)
                        importNode.name = ts.createIdentifier(originalName + '$$')
                    }
                })

                if (originalName && !hasHMRImport) {
                    const extraStatement = ts.createVariableStatement(
                        [],
                        ts.createVariableDeclarationList([
                            ts.createVariableDeclaration(
                                originalName,
                                undefined,
                                ts.createCall(
                                    ts.createIdentifier(originalName + '$$'),
                                    undefined,
                                    [ts.createIdentifier('module')]
                                )
                            )
                        ], ts.NodeFlags.Const)
                    )
                    return [node, extraStatement]
                }
            }

            return ts.visitEachChild(node, visitor, context)
        }

        return ts.visitEachChild(source, visitor, context)
    }
}
