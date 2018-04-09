import { html } from 'ssr-lit-html'
import { escapeRegExp } from '../html.js'
import { FragmentMetadata } from '../gql.js'

const rand = Math.random().toString().substr(2)

export function fragmentTpl(fragment: (FragmentMetadata & { key: string })) {
    let parsedBody = fragment.body
    let i = 0
    const values = []
    Object.keys(fragment.dependencyKeyMap)
        .forEach(name => {
            let regex = new RegExp(escapeRegExp('...' + name), 'g')
            parsedBody = parsedBody.replace(regex, () => {
                values.push(html`...<a href="../fragments/${fragment.dependencyKeyMap[name]}.html">${name}</a>`);
                i++
                return `A${i}_${rand}`
            })
        })

    const parts = parsedBody.split(new RegExp(`A\\d+_${rand}`, 'g'))
    parsedBody = html(parts, ...values)

    return html`
        <h1>${fragment.name}</h1>
        <div class="item-content">
            <h3>Fragment signature</h3>
            <pre><code class="graphql">${parsedBody}</code></pre>
        </div>
    `
}