import type { Plugin } from "unified";
import { codes } from "micromark-util-symbol/codes";
import { Extension, Token, Tokenizer } from "micromark-util-types";
import { Extension as MdastExtension } from "mdast-util-from-markdown";

import { genUtils } from "./parseUtils";

export enum NotesElements {
    Notes = "notes",
    NotesContent = "notes-content",
    NotesInline = "notes-inline",
    NotesTextArea = "notes-text-area",
}

declare module 'mdast' {
    type _notes_BCM = {
        [NotesElements.Notes]: {
            type: NotesElements.Notes;
            data: {
                hName: NotesElements.Notes;
                hProperties: Record<string, unknown>;
            }
        }
    }

    interface BlockContentMap extends _notes_BCM { }
}

type NotesToken = {
    kind: "inline" | "text-area";
    big: boolean;
} & Token;

const TokenizeNotesInput = (): Tokenizer => {
    return function (effects, ok, nok) {
        const utils = genUtils(this, effects);
        let kind: "text-area" | "inline" = "inline";
        let count = 2;

        const fn = utils.withNamedSteps(
            NotesElements.Notes,
            (t: NotesToken) => {
                t.kind = kind;
                t.big = count >= 6;
            },
            utils.expect("["),
            utils.branch({
                [codes.equalsTo]: utils.withSteps(
                    utils.expect("=="),
                    utils.readUntil([utils.expect((c) => c !== codes.equalsTo)], () => count++),
                    utils.expect("]", () => kind = "text-area"),
                ),
                [codes.underscore]: utils.withSteps(
                    utils.expect("__"),
                    utils.readUntil([utils.expect((c) => c !== codes.underscore)], () => count++),
                    utils.expect("]", () => kind = "inline"),
                ),
            }),
        );

        return utils.apply(fn, ok, nok);
    }
}

const notesParser = (): Extension => {
    return {
        text: {
            [codes.leftSquareBracket]: {
                tokenize: TokenizeNotesInput(),
            }
        }
    }
}

const fromMarkdown = (): MdastExtension => {
    return {
        enter: {
            [NotesElements.Notes](t) {
                const token = t as NotesToken;
                this.enter({
                    type: NotesElements.Notes,
                    data: {
                        hName: NotesElements.Notes,
                        hProperties: {
                            kind: token.kind,
                            big: token.big,
                        }
                    }
                }, token);
            }
        },
        exit: {
            [NotesElements.Notes](token) {
                this.exit(token);
            }
        }
    }
}

export const NotesPlugin: Plugin = function () {
    const data = this.data();

    const add = (field: string, value: unknown) => {
        const list = (data[field] ? data[field] : (data[field] = [])) as unknown[];
        list.push(value);
    }

    add("micromarkExtensions", notesParser());
    add("fromMarkdownExtensions", fromMarkdown());
}