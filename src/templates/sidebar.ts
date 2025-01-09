import { html } from '@lit-labs/ssr'
import { FragmentMetadata, OperationMeteadata } from '../gql.js'

export function sidebarTpl(
    operations: Array<OperationMeteadata & { key: string }>,
    fragments: Array<FragmentMetadata & { key: string }>,
    urlPrefix: string = ''
) {
    return html`
    <div class="sidebar__content">
        ${operations.length < 1
            ? ''
            : html`
                <h2>Operations</h2>
                <ul>
                    ${operations.map((el) => html`
                    <li>
                        <a href="${urlPrefix}operations/${el.key}.html">${el.name}</a>
                    </li>
                    `)}
                </ul>
            `}
        ${fragments.length < 1
            ? ''
            : html`
                <h2>Fragments</h2>
                <ul>
                    ${fragments.map((el) => html`
                        <li>
                        <a href="${urlPrefix}fragments/${el.key}.html">${el.name}</a>
                        </li>
                    `)}
                </ul>
            `}
    </div>
`
}
