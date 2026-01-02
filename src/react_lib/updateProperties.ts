import type { OpCode } from "./commits"
import type { vnode } from "./render"

// interface propDiff { old?: any, new?: any, op: string, key: string }
export function propsDiff(prev: vnode, curr: vnode) {
    const out: Array<OpCode> = []
    for (const key of Object.keys(prev.props)) {
        if (Object.hasOwn(curr.props, key)) {
            prev.props[key] != curr.props[key] && out.push(getOp(key, "upd", curr))
        }
        else out.push(getOp(key, "del", prev))
    }

    for (const key of Object.keys(curr.props)) {
        if (!Object.hasOwn(prev.props, key)) out.push(getOp(key, "add", curr))
    }
    return out
}

function getOp(key: string, op: "add" | "upd" | "del", node: vnode): OpCode {
    const domProperties = ["value", "checked", "nodeValue"]
    if (domProperties.includes(key)) {
        switch (op) {
            case "add":
            case "upd": return { code: "upd_prop", key, curr: node }
            case "del": return { code: "del_prop", key, curr: node }
        }
    }
    if (key.startsWith("on")) {
        // key = getListenerName(key)
        switch (op) {
            case "add": return { code: "add_lsnr", key, curr: node }
            case "upd": return { code: "upd_lsnr", key, curr: node }
            case "del": return { code: "del_lsnr", key, prev: node }
        }
    }
    switch (op) {
        case "add":
        case "upd": return { code: "upd_attr", key, curr: node }
        case "del": return { code: "del_attr", key, prev: node }
    }

}


// function updateListeners(prev: Record<string, any>, curr: Record<string, any>, domNode: DomElement) {

//     if (Object.keys(prev).length != Object.keys(curr).length) console.log(prev, curr)
//     const dom = domNode as HTMLElement
//     if (typeof dom.setAttribute != 'function') return
//     const keys = Object.keys(curr)

//     keys.forEach(key => {
//         if (!(key.startsWith("on") && typeof curr[key] == "function")) return
//         if (curr[key] == prev[key]) return

//         if (domNode._handlers == undefined) domNode._handlers = {}

//         if (!Object.hasOwn(prev, key)) {
//             // add event handler
//             createListener(domNode, key)

//         }
//         domNode._handlers[key] = curr[key] as () => void
//     })

//     // discard deleted event handlers
//     Object.keys(prev).filter(key => !keys.includes(key))
//         .forEach(key => {
//             // dom.removeAttribute(key)
//             if (!domNode?._listeners?.[key]) return
//             domNode.removeEventListener(getListenerName(key), domNode?._listeners?.[key])
//             delete domNode?._listeners?.[key]
//             delete domNode?._handlers?.[key]
//         })
// }

