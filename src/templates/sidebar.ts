import { html, repeat } from '../html.js'
import { OperationMeteadata, FragmentMetadata } from '../gql.js'

export function sidebarTpl(operations: (OperationMeteadata & { key: string })[], fragments: (FragmentMetadata & { key: string })[], urlPrefix: string = '') {
    return html`
        <div class="sidebar">
            ${operations.length < 1 ? '' : html`
                <h2>Operations</h2>
                <ul>
                    ${repeat(operations, (el) => html`
                    <li>
                        <a href="${urlPrefix}operations/${el.key}.html">${el.name}</a>
                    </li>
                    `)}
                </ul>
            `} 
            ${fragments.length < 1 ? '' : html`
                <h2>Fragments</h2>
                <ul>
                    ${repeat(fragments, (el) => html`
                    <li>
                        <a href="${urlPrefix}fragments/${el.key}.html">${el.name}</a>
                    </li>
                    `)}
                </ul>
            `}
        </div>
    `
}