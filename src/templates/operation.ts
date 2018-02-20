import { html, escapeRegExp } from '../html.js'
import { OperationMeteadata } from '../gql.js'

export function operationTpl(operation: (OperationMeteadata & { key: string })) {
    let parsedBody = operation.body
    Object.keys(operation.dependencyKeyMap)
        .forEach(name => {
            let regex = new RegExp(escapeRegExp('...' + name), 'g')
            parsedBody = parsedBody.replace(regex, `...<a href="../fragments/${operation.dependencyKeyMap[name]}.html">${name}</a>`)
        })

    const signature: any = { id: operation.key }
    if (Object.keys(operation.variables).length > 0)
        signature.variables = operation.variables

    return html`
        <h1>${operation.name}</h1>
        <div class="item-content">
            <h3>Use as precompiled operation:</h3>
            <pre><code class="javascript">${JSON.stringify(signature, null, 2)}</code></pre>
            <h3>Operation signature</h3>
            <pre><code class="graphql">${parsedBody}</code></pre>
        </div>
    `
}