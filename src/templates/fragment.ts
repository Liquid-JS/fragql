import { html } from 'ssr-lit-html'
import { escapeRegExp } from '../html.js'
import { FragmentMetadata } from '../gql.js'

export function fragmentTpl(fragment: (FragmentMetadata & { key: string })) {
    let parsedBody = fragment.body
    Object.keys(fragment.dependencyKeyMap)
        .forEach(name => {
            let regex = new RegExp(escapeRegExp('...' + name), 'g')
            parsedBody = parsedBody.replace(regex, `...<a href="../fragments/${fragment.dependencyKeyMap[name]}.html">${name}</a>`)
        })

    return html`
        <h1>${fragment.name}</h1>
        <div class="item-content">
            <h3>Fragment signature</h3>
            <pre><code class="graphql">${parsedBody}</code></pre>
        </div>
    `
}