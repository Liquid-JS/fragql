import { html, ServerRenderedTemplate } from "@lit-labs/ssr";
import { OperationMeteadata } from "../gql.js";
import { escapeRegExp } from "../html.js";
import { makeTemplateObject } from "../utils/html.js";

const rand = Math.random().toString().substring(2);

export function operationTpl(operation: OperationMeteadata & { key: string }) {
  let parsedBody = operation.body;
  let i = 0;
  const values = new Array<ServerRenderedTemplate>();
  Object.keys(operation.dependencyKeyMap).forEach((name) => {
    const regex = new RegExp(escapeRegExp("..." + name), "g");
    parsedBody = parsedBody.replace(regex, () => {
      values.push(html`...<a href="../fragments/${operation.dependencyKeyMap[name]}.html">${name}</a>`);
      i++;
      return `A${i}_${rand}`;
    });
  });

  const parts = parsedBody.split(new RegExp(`A\\d+_${rand}`, "g"));
  const result = html(makeTemplateObject(parts), ...values);

  const signature: { id: string; variables?: { [key: string]: string } } = { id: operation.key };
  if (Object.keys(operation.variables).length > 0) signature.variables = operation.variables;

  return html`
    <h1>${operation.name}</h1>
    <div class="item-content">
      <h3>Use as precompiled operation:</h3>
      <pre><code class="javascript">${JSON.stringify(signature, null, 2)}</code></pre>
      <h3>Operation signature</h3>
      <pre><code class="graphql">${result}</code></pre>
    </div>
  `;
}
