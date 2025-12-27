import type { DomElement } from "./render"

export function updateProps(prev: Record<string, any>, curr: Record<string, any>, domNode: HTMLElement | Text | ChildNode) {
    // these are values you want to directly set on dom, not as attributes
    const domProperties = ["value", "checked"]

    const attributesPrev: Record<string, any> = {}
    const listenersPrev: Record<string, any> = {}

    const attributesCurr: Record<string, any> = {}
    const listenersCurr: Record<string, any> = {}

    Object.keys(curr).forEach(key => {
        if (domProperties.includes(key)) {
            (domNode as any)[key] = curr[key]
        } else if (key.startsWith("on") && typeof curr[key] == "function") {
            listenersCurr[key] = curr[key]
        } else {
            attributesCurr[key] = curr[key]
        }
    })

    Object.keys(prev).forEach(key => {
        if (domProperties.includes(key)) {
            if (!Object.hasOwn(curr, key)) (domNode as any)[key] = null
        } else if (key.startsWith("on") && typeof prev[key] == "function") {
            listenersPrev[key] = prev[key]
        } else {
            attributesPrev[key] = prev[key]
        }
    })

    if (!domNode) {
        console.error("PROP_UPDATE_ERR: DOM NODE WAS NULL FOR THIS DIFF", prev, curr)
    }
    updateAttributes(attributesPrev, attributesCurr, domNode)
    updateListeners(listenersPrev, listenersCurr, domNode)

}


function updateAttributes(prev: Record<string, any>, curr: Record<string, any>, domNode: DomElement) {

    const dom = domNode as HTMLElement
    if (typeof dom?.setAttribute != 'function') return
    const keys = Object.keys(curr)
    keys.forEach(key => {
        if (key.startsWith("on") && typeof curr[key] == "function") return
        if (curr[key] == prev[key]) return
        dom.setAttribute(key, curr[key])
    })

    Object.keys(prev).filter(key => !(key.startsWith("on") && typeof curr[key] == "function") && !keys.includes(key)).forEach(key => dom.removeAttribute(key))
}


function updateListeners(prev: Record<string, any>, curr: Record<string, any>, domNode: DomElement) {

    if (Object.keys(prev).length != Object.keys(curr).length) console.log(prev, curr)
    const dom = domNode as HTMLElement
    if (typeof dom.setAttribute != 'function') return
    const keys = Object.keys(curr)

    keys.forEach(key => {
        if (!(key.startsWith("on") && typeof curr[key] == "function")) return
        if (curr[key] == prev[key]) return

        if (domNode._handlers == undefined) domNode._handlers = {}

        if (!Object.hasOwn(prev, key)) {
            // add event handler
            createListener(domNode, key)

        }
        domNode._handlers[key] = curr[key] as () => void
    })

    // discard deleted event handlers
    Object.keys(prev).filter(key => !keys.includes(key))
        .forEach(key => {
            // dom.removeAttribute(key)
            if (!domNode?._listeners?.[key]) return
            domNode.removeEventListener(getListenerName(key), domNode?._listeners?.[key])
            delete domNode?._listeners?.[key]
            delete domNode?._handlers?.[key]
        })
}

export function createListener(dom: DomElement, key: string) {
    if (!dom._listeners) dom._listeners = {}
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

