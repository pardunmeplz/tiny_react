import type { fiberNode } from "./fiber"
import type { vnode } from "./render"

export type DomElement = (HTMLElement | ChildNode | Text) & {
    _handlers?: Record<string, (e: Event) => void>
    _listeners?: Record<string, EventListener>
}

export type OpCode = {
    code: "create" | "createText" | "replace" | "append" | "insert" | "remove" | "setCurr"
    | "upd_prop" | "del_prop" | "add_lsnr" | "upd_lsnr" | "del_lsnr" | "upd_attr" | "del_attr"

    // vnodes 
    // A?: vnode
    // B?: vnode
    curr?: vnode
    prev?: vnode

    //props
    old?: any
    new?: any
    key?: string

    // insert position
    index?: number

    // hook state id
    fiber?: fiberNode
}

export function commitPhase(ops: Array<OpCode>) {
    var focusElement: any = document.activeElement
    ops.forEach((op) => {
        switch (op.code) {
            case "create":
                if (!op.curr) throw new Error("Missing virtual node for commit!")
                op.curr.dom = createElement(op.curr)
                break
            case "createText":
                if (!op.curr) throw new Error("Missing virtual node for commit!")
                op.curr.dom = createTextNode(op.curr)
                break
            case "replace":
                if (!op.curr?.dom || !op.prev?.dom) throw Error("Missing dom element for commit!")
                op.prev.dom.replaceWith(op.curr.dom)
                break
            case "append":
                if (!op.curr?.dom || !op.prev?.dom) throw Error("Missing dom element for commit!")
                op.prev.dom.appendChild(op.curr.dom)
                break
            case "insert":
                op.prev?.dom?.insertBefore(op.curr?.dom!, op.prev?.dom?.childNodes[op.index ?? 0])
                break
            case "remove":
                if (!op.curr?.dom) throw new Error("Missing dom element for commit!")
                op.prev?.dom?.removeChild(op.curr?.dom)
                break
            case "setCurr":
                if (op.curr) op.curr.dom = op.prev?.dom
                break
            case "upd_prop":
                (op.curr?.dom as any)[op.key ?? ""] = op.curr?.props[op.key ?? ""]
                break
            case "del_prop":
                (op.prev?.dom as any)[op.key ?? ""] = ""
                break
            case "add_lsnr":
                if (!op.curr?.dom) throw new Error("Missing dom element for commit!");
                createListener(op.curr?.dom, op.key ?? "")
                op.curr.dom._handlers![op.key ?? ""] = op.curr?.props?.[op.key ?? ""] as () => void
                break
            case "upd_lsnr":
                if (!op.curr?.dom) throw new Error("Missing dom element for commit!");
                op.curr.dom._handlers![op.key ?? ""] = op.curr?.props?.[op.key ?? ""] as () => void
                break
            case "del_lsnr":
                if ((op.curr?.dom)?._listeners?.[op.key ?? ""]) (op.curr?.dom)?.removeEventListener(op.key ?? "", (op.curr?.dom)?._listeners?.[op.key ?? ""])
                delete (op.curr?.dom)?._listeners?.[op.key ?? ""]
                delete (op.curr?.dom)?._handlers?.[op.key ?? ""]
                break
            case "upd_attr":
                (op.curr?.dom as HTMLElement)?.setAttribute(op.key ?? "", op.curr?.props[op.key ?? ""])
                break
            case "del_attr":
                (op.curr?.dom as HTMLElement)?.removeAttribute(op.key ?? "")
                break
        }
    })
    focusElement?.focus?.()
}

function createTextNode(node: vnode): DomElement {
    var dom = document.createTextNode(node.props.nodeValue)
    node.dom = dom
    return dom
}

function createElement(node: vnode): DomElement {
    const element: DomElement = document.createElement(node.type as string)
    node.dom = element

    return element
}


export function createListener(dom: DomElement, key: string) {
    if (!dom._listeners) dom._listeners = {}
    if (!dom._handlers) dom._handlers = {}
    if (dom._listeners[key]) return

    const realListener = function(this: DomElement, event: Event) {
        const handler = (this)._handlers?.[key]
        if (handler) handler(event)
    }

    dom._listeners[key] = realListener

    dom.addEventListener(getListenerName(key), realListener)

}

function getListenerName(key: string) {
    const keyToDomMap: Record<string, string> = {
        onBlur: "change",
        onChange: "input"
    }
    return keyToDomMap[key] ?? key.toLowerCase().substring(2)
}

