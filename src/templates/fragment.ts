import { html, ServerRenderedTemplate } from '@lit-labs/ssr'
import { FragmentMetadata } from '../gql.js'
import { escapeRegExp } from '../html.js'
import { makeTemplateObject } from '../utils/html.js'

const rand = Math.random().toString().substring(2)

export function fragmentTpl(fragment: FragmentMetadata & { key: string }) {
    let parsedBody = fragment.body
    let i = 0
    const values = new Array<ServerRenderedTemplate>()
    Object.keys(fragment.dependencyKeyMap).forEach((name) => {
        const regex = new RegExp(escapeRegExp('...' + name), 'g')
        parsedBody = parsedBody.replace(regex, () => {
            values.push(html`...<a href="../fragments/${fragment.dependencyKeyMap[name]}.html">${name}</a>`)
            i++
            return `A${i}_${rand}`
        })
    })

    const parts = parsedBody.split(new RegExp(`A\\d+_${rand}`, 'g'))
    const result = html(makeTemplateObject(parts), ...values)

    return html`
    <h1>${fragment.name}</h1>
    <div class="item-content">
      <h3>Fragment signature</h3>
      <pre><code class="graphql">${result}</code></pre>
    </div>
  `
}
