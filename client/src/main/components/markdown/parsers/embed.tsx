import type { Plugin } from "unified";
import { codes } from "micromark-util-symbol/codes";
import { Code, Extension, Token, Tokenizer } from "micromark-util-types";
import { Extension as MdastExtension } from "mdast-util-from-markdown";

import { codeToString, genUtils } from "./parseUtils";

export enum EmbedElements {
    Embed = "embed",
}

declare module 'mdast' {
    type _embed_BCM = {
        [EmbedElements.Embed]: {
            type: EmbedElements.Embed;
            data: {
                hName: EmbedElements.Embed;
                hProperties: Record<string, unknown>;
            }
        }
    }

    interface BlockContentMap extends _embed_BCM { }
}

type EmbedToken = {
    kind: string;
    url: string;
    hoverText: string;
} & Token;

const TokenizeEmbed = (): Tokenizer => {
    return function (effects, ok, nok) {
        const utils = genUtils(this, effects);
        let embedData = "";
        let url = "";

        const fn = utils.withNamedSteps(
            EmbedElements.Embed,
            (t: EmbedToken) => {
                const [kind, hover] = embedData.split(":");
                t.kind = kind;
                t.hoverText = hover;
                t.url = url;
            },
            utils.expect("[!embed:"),
            utils.readUntil(["]"], (c) => embedData += codeToString(c)),
            utils.expect("]"),
            utils.expect("("),
            utils.readUntil([")"], (c) => url += codeToString(c)),
            utils.expect(")"),
        );

        return utils.apply(fn, ok, nok);
    }
}

const notesParser = (): Extension => {
    return {
        text: {
            [codes.leftSquareBracket]: {
                tokenize: TokenizeEmbed(),
            }
        }
    }
}

const fromMarkdown = (): MdastExtension => {
    return {
        enter: {
            [EmbedElements.Embed](t) {
                const token = t as EmbedToken;
                this.enter({
                    type: EmbedElements.Embed,
                    data: {
                        hName: EmbedElements.Embed,
                        hProperties: {
                            kind: token.kind,
                            url: token.url,
                            hoverText: token.hoverText,
                        }
                    }
                }, token);
            }
        },
        exit: {
            [EmbedElements.Embed](token) {
                this.exit(token);
            }
        }
    }
}

export const EmbedPlugin: Plugin = function () {
    const data = this.data();

    const add = (field: string, value: unknown) => {
        const list = (data[field] ? data[field] : (data[field] = [])) as unknown[];
        list.push(value);
    }

    add("micromarkExtensions", notesParser());
    add("fromMarkdownExtensions", fromMarkdown());
}