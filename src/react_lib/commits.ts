import constants from "./constants"
import type { vnode } from "./render"
import { createListener, updateProps } from "./updateProperties"

export type DomElement = (HTMLElement | ChildNode | Text) & {
    _handlers?: Record<string, (e: Event) => void>
    _listeners?: Record<string, EventListener>
}

export type OpCode = {
    code: "createA" | "replaceB" | "appendAtoB" | "updatePropsB" | "insertAinB" | "removeAfromB" | "updateTextNodeB" | "setAasB"
    A?: vnode
    B?: vnode
    index?: number
}

var commitQueue: Array<OpCode> = []

export const pushToCommit = (code: OpCode) => commitQueue.push(code)
export const clearCommit = () => commitQueue = []


export function commitPhase() {
    var focusElement: HTMLElement | undefined
    commitQueue.forEach((op) => {
        switch (op.code) {
            case "createA":
                if (!op.A) throw new Error("Missing virtual node for commit!")
                op.A.dom = createElement(op.A)
                break
            case "replaceB":
                if (!op.A?.dom || !op.B?.dom) throw Error("Missing dom element for commit!")
                op.B.dom.replaceWith(op.A.dom)
                break
            case "appendAtoB":
                // adding focus check in case focused element was re-ordered
                if (document.activeElement == op.A?.dom) focusElement = op.A?.dom as HTMLElement

                if (!op.A?.dom || !op.B?.dom) throw Error("Missing dom element for commit!")
                op.B.dom.appendChild(op.A.dom)
                break
            case "updatePropsB":
                if (!op.B?.dom) throw Error("Missing dom element for commit!")
                updateProps(op.B.props, op.A?.props ?? {}, op.B.dom)
                break
            case "insertAinB":
                // adding focus check in case focused element was re-ordered
                if (document.activeElement == op.A?.dom) focusElement = op.A?.dom as HTMLElement

                op.B?.dom?.insertBefore(op.A?.dom!, op.B?.dom?.childNodes[op.index ?? 0])
                break
            case "removeAfromB":
                if (!op.A?.dom) throw new Error("Missing dom element for commit!")
                op.B?.dom?.removeChild(op.A?.dom)
                break
            case "updateTextNodeB":
                (op.B?.dom as Text).nodeValue = op.A?.props.nodeValue
                if (op.A) op.A.dom = op.B?.dom
                break
            case "setAasB":
                if (op.A) op.A.dom = op.B?.dom
                break
        }
    })
    focusElement?.focus?.()
}

function createElement(node: vnode): DomElement {
    if (node.type == constants.Element_Text_NODE) {
        var dom = document.createTextNode(node.props.nodeValue)
        node.dom = dom
        return dom
    }
    const element: DomElement = document.createElement(node.type as string)
    Object.keys(node.props).forEach((key) => {
        if (key.startsWith("on") && typeof node.props[key] == "function") {
            // all event listners will start with on
            createListener(element, key)
            if (element._handlers == undefined) element._handlers = {}
            element._handlers[key] = node.props[key]
        } else {
            (element as HTMLElement).setAttribute(key, node.props[key])
        }
    })

    node.children.forEach(x => (element as HTMLElement).append(createElement(x)))
    node.dom = element

    return element
}

