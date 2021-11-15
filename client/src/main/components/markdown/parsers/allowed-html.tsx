import { Node, Parent, visit } from "unist-util-visit"

export interface Options {
    tags?: string[];
    singleTags?: string[];
    stripComments?: boolean;
}

interface Tag {
    tagName: string;
    isClosing: boolean;
    isSelfClosing: boolean;
}

const alterNode = (node: Node | undefined, tagName: string, children: Node[] = []): Node => {
    node = node ?? {
        type: "safe-html",
        position:
            children[0]?.position && children[children.length - 1]?.position
            ? {
                start: children[0].position.start,
                end: children[children.length - 1].position!.end
            } : undefined
    }

    node.type = "safe-html";
    node.data ??= {};
    node.data.hName = tagName;
    (node as Parent).children = children;
    node.data.hProperties = {};

    return node;
}

const parseChildren = (children: Node[], tags: Set<string>): Node[] => {
    const corrections: [number, number, Node][] = [];
    for (let i = 0; i < children.length; i++) {
        const node = children[i];
        const tag = getTag(node);
        if (!tag || !tags.has(tag.tagName)) continue;

        if (tag.isSelfClosing) {
            corrections.push([i, i, alterNode(node, tag.tagName)]);
            continue;
        }

        if (!tag.isClosing) {
            const start = i;

            for (i = i + 1; i < children.length; i++) {
                const endNode = children[i];
                const endTag = getTag(endNode);
                if (!endTag
                    || !endTag.isClosing
                    || endTag.isSelfClosing
                    || tag.tagName !== endTag.tagName
                ) continue;

                const newChildren = parseChildren(children.slice(start + 1, i), tags);
                corrections.push([start, i, alterNode(undefined, endTag.tagName, newChildren)]);
                break;
            }
        }
    }

    for (const [start, end, node] of corrections.reverse()) {
        children.splice(start, end - start + 1, node);
    }

    return children;
}

const getTag = (n: Node): Tag | undefined => {
    if (n.type !== "html") return undefined;

    const node = n as Node & { value: string };
    const tag = node.value.match(/<(\/?)\s*([a-zA-Z0-9-]+)\s*(\/?)>/);

    if (tag === null) return undefined;

    const tagName = tag[2];
    const isClosing = tag[1] === "/";
    const isSelfClosing = tag[3] === "/";

    return { tagName, isClosing, isSelfClosing };
}

const strippedComment = (n: Node) => {
    if (n.type !== "html") return;

    const node = n as Node & { value: string };
    const comment = node.value.match(/^<!--(.|\n)*-->/);
    if (comment === null) return;

    const newValue = node.value.slice(comment[0].length);
    node.value = newValue;
}

export const AllowedHtmlPlugin = (options: Options) => {
    const tags = new Set(options.tags);
    const singleTags = new Set(options.singleTags);

    return function (this: any) {
        return (node: Node) => {
            console.log(node);
            visit(node, "html", (node: Node | Parent) => {
                const selfTag = getTag(node);
                if (selfTag !== undefined && !selfTag.isClosing) {
                    if (singleTags.has(selfTag.tagName)) {
                        alterNode(node, selfTag.tagName);
                    }
                }

                if (options.stripComments) {
                    strippedComment(node);
                }
            });

            visit(node, undefined, (node: Node | Parent) => {
                if (!("children" in node)) return
                node.children = parseChildren(node.children, tags);
            });

        }
    }
}