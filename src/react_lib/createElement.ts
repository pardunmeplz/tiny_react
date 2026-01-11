import constants from "./constants";
import type { component, vnode } from "./render";

function createTextNode(text: number | string): vnode {
    return { type: constants.Element_Text_NODE, props: { nodeValue: text }, children: [] }
}

export function createElement(type: string | component, props?: Record<string, any>, ...children: Array<vnode | string | number>): vnode {
    if (!children) children = []
    const childrenFinal = children.map(x => {
        if (typeof x == "string" || typeof x == "number") return createTextNode(x)
        return x
    })

    console.log({ type: type, props: props ?? {}, children: childrenFinal })
    return { type: type, props: props ?? {}, children: childrenFinal }
}
