import constants from "./constants";
import type { vnode } from "./render";

export function createTextNode(text: number | string): vnode {
    return { type: constants.Element_Text_NODE, props: { nodeValue: text }, children: [] }
}
