import {
  DocumentNode,
  FieldNode,
  FragmentDefinitionNode,
  InlineFragmentNode,
  OperationDefinitionNode,
  SelectionSetNode
} from "graphql";

export function parseSelectionSet(
  selectionSet: SelectionSetNode,
  dependenciesMap: { [name: string]: SelectionSetNode }
) {
  selectionSet.selections = selectionSet.selections.flatMap((selectionObj) => {
    if (selectionObj.kind == "FragmentSpread" && selectionObj.name.value in dependenciesMap) {
      return dependenciesMap[selectionObj.name.value].selections;
    } else {
      const selection = selectionObj as FieldNode | InlineFragmentNode;
      if (selection.selectionSet)
        Object.assign(selection, {
          selectionSet: parseSelectionSet(selection.selectionSet, dependenciesMap)
        });

      return [selection];
    }
  });

  return selectionSet;
}

export function flatten(doc: DocumentNode) {
  const op = doc.definitions[0] as FragmentDefinitionNode | OperationDefinitionNode;
  const dep = doc.definitions.slice(1) as FragmentDefinitionNode[];
  const map: { [name: string]: SelectionSetNode } = {};
  dep.reverse().forEach((node) => (map[node.name.value] = parseSelectionSet(node.selectionSet, map)));
  Object.assign(op, {
    selectionSet: parseSelectionSet(op.selectionSet, map)
  });
  Object.assign(doc, {
    definitions: [op]
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function recursiveNodes(node: any, cb: (node: any) => void) {
  if (!node.kind || !(typeof node === "object")) return;

  cb(node);

  Object.keys(node).forEach((key) => {
    if (!node[key]) return;

    if (Array.isArray(node[key])) return node[key].forEach((el) => recursiveNodes(el, cb));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recursiveNodes(node[key] as any, cb);
  });
}
