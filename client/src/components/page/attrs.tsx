import { NodeData, Node, Parent } from "unist";
import { Test } from "unist-util-visit";
import { visitParents } from "unist-util-visit-parents";

interface TextNode {
    type: "text";
    value: string;
}

const decendSpine = (node: Node | Parent): Node => {
    if ("children" in node && node.children.length > 0) {
        return decendSpine(node.children.slice(-1)[0]);
    }

    return node;
}

const getPreviousNode = (node: Node, parents: Parent[]): Node | undefined => {
    if (parents.length === 0) {
        return undefined;
    }

    const parent = parents[parents.length - 1];
    const index = parent.children.findIndex((n) => n === node);
    if (index < 0) {
        console.warn("Parental tree corrupted", node, parents);
        return undefined;
    }

    if (index === 0) {
        return getPreviousNode(parent, parents.slice(0, parents.length - 1));
    }

    const predecessor = parent.children[index - 1] as Node | Parent;
    return decendSpine(predecessor);
}

export const AttrPlugin = function (this: any) {
    return (tree: Node) => {
        console.log(tree);
        visitParents(tree, "text", (node: TextNode, parents) => {
            const attrsRe = /\s*(\{\{([^\}]+)\}\})/g
            const sibling = getPreviousNode(node, parents);
            const match = attrsRe.exec(node.value as string);

            if (match) {
                console.log(node, parent)
            }
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