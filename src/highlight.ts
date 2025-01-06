import * as highlight from "cm-highlight";
import "codemirror-graphql/mode";
import "codemirror/mode/javascript/javascript";

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

window["cmHl"] = highlight;

["graphql", "javascript"].forEach((type) => {
  document.querySelectorAll("pre > code." + type).forEach((el) => {
    const subMap: { [key: string]: string } = {};
    let i = 0;
    el.querySelectorAll("a").forEach((a) => {
      const k = `ffRepA${i}`;
      subMap[k] = a.outerHTML;
      a.textContent = k;
      i++;
    });
    const code = el.textContent;
    let hl = highlight(code, { mode: type });
    Object.keys(subMap).forEach((find) => {
      hl = hl.replace(new RegExp(escapeRegExp(find), "g"), subMap[find]);
    });
    el.innerHTML = hl;
    el.parentElement.classList.add("cm-s-graphiql");
  });
});
