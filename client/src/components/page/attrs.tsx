import { NodeData, Node, Parent } from "unist";
import { visit } from "unist-util-visit";

interface TextNode {
    type: "text";
    value: string;
}

interface InlineCodeNode {
    type: "inlineCode";
    value: string;
}

interface Paragraph {
    type: "paragraph";
    children: TreeNode[];
}

type TreeNode = TextNode | InlineCodeNode | Paragraph;

export const AttrPlugin = function (this: any) {
    return (tree: Node) => {
        visit(tree, "text", (node: NodeData<Parent>, idx, parent) => {
            const attrsRe = /\s*(\{\{([^\}]+)\}\})/g
            const sibling = parent?.children[(idx ?? 0) - 1]
            const match = attrsRe.exec(node.value as string);

            if (match && sibling) {
                node.value = (node.value as string).slice(match[0].length)

                const sAny = sibling as any;
                sAny.data ??= {};
                sAny.data.hProperties ??= {};
                sAny.data.hProperties.attrs = match[2];
            }
        })
    }
}