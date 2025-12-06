import constants from "./constants"
import { componentId, setComponent, unmountState } from "./useState"

export type component = (prop: Record<string, any>) => vnode

export interface vnode {
    type: string | component
    props: Record<string, any>
    children: Array<vnode>
    id?: string
}

var currContainer: HTMLElement | null = null
var currVnode: vnode | null = null
export var currComponent: component | null = null

type DomElement = (HTMLElement | ChildNode | Text) & {
    _handlers?: Record<string, (e: Event) => void>
    _listeners?: Record<string, EventListener>
}

var snapshot: vnode | null = null

const idGenerator = {
    id: ["0"],
    getId: function() { return this.id.reduce((a, b) => a + "." + b, "") },
    replace: function(id: string) { this.id[this.id.length - 1] = id },
    addChild: function() { this.id.push("0") },
    dropChild: function() { this.id.pop() },
    reset: function() { this.id = ["0"] }
}

function createElement(node: vnode): DomElement {
    if (node.type == constants.Element_Text_NODE) return document.createTextNode(node.props.nodeValue)
    const element: DomElement = document.createElement(node.type as string)
    Object.keys(node.props).forEach((key) => {
        if (key.startsWith("on") && typeof node.props[key] == "function") {
            // all event listners will start with on
            createListener(element, key)
            if (element._handlers == undefined) element._handlers = {}
            element._handlers[key] = node.props[key]
            // element.addEventListener(key.toLowerCase().substring(2), node.props[key])
        } else {
            (element as HTMLElement).setAttribute(key, node.props[key])
        }
    })

    node.children.forEach(x => (element as HTMLElement).append(createElement(x)))

    return element
}

function renderComponent(node: vnode): vnode {

    const parentComponent = currComponent
    const parentId = componentId
    if (typeof node.type == "function") {

        // unique key setup for new component boundary
        if (node.props.key) {
            setComponent("" + node.props.key)
        } else {
            setComponent(idGenerator.getId())
        }

        currComponent = node.type
        node = node.type({ ...node.props, children: node.children })
    }

    node.id = idGenerator.getId()

    idGenerator.addChild()
    node.children = node.children.map((child, i) => {

        // var type = getTypeString(child)

        idGenerator.replace("" + i)
        return renderComponent(child)
    })
    idGenerator.dropChild()

    // return to parent boundary at end of component evaluation 
    currComponent = parentComponent
    if (parentId) setComponent(parentId)

    return node
}

function recon(node: vnode, container: HTMLElement) {
    const snapshot_new = renderComponent(node)

    if (!snapshot) {
        snapshot = snapshot_new // uncomment to start diffing instead of full dom re-renders
        container.replaceChildren(createElement(snapshot_new))
        return
    }

    console.log(snapshot, snapshot_new)
    commit(snapshot, snapshot_new, container.childNodes[0])
    snapshot = snapshot_new
}

function commit(prev: vnode, curr: vnode, dom: HTMLElement | Text | ChildNode): (HTMLElement | Text | ChildNode) {
    // check type
    if (prev.type != curr.type) {
        if (prev.id) unmountState(prev.id)
        const newDom = createElement(curr)
        dom.replaceWith(newDom)
        return newDom
    }

    // check text nodes
    if (prev.type == constants.Element_Text_NODE && prev.props.nodeValue != curr.props.nodeValue) {
        (dom as Text).nodeValue = curr.props.nodeValue
        return dom
    }

    // update props
    updateProps(prev.props, curr.props, dom)
    updateListeners(prev.props, curr.props, dom)


    let deleteArr: Array<vnode | null> = [...prev.children]

    // todo: you need to check changes in index between old and new children and reorder dom accordingly
    curr.children.forEach((currChild, index) => {
        const i = deleteArr.findIndex(old => currChild.id == old?.id)
        if (i == -1) {
            // mount child here
            const element = createElement(currChild)
            dom.insertBefore(element, dom.childNodes[index])
            deleteArr.splice(index, 0, null)
            return
        }

        // since screenshot is the prev vdom rep, it should mirror the stale dom in structure so indices should match
        const childDom = dom.childNodes[i]
        const prevChild = deleteArr[i]!

        deleteArr[i] = null

        commit(prevChild, currChild, childDom)
    })

    deleteArr.forEach(node => node?.id ? unmountState(node.id) : null)
    deleteArr.map((val, i) => !val ? null : dom.childNodes[i]).forEach(child => child ? dom.removeChild(child) : null)

    return dom
}


function updateProps(prev: Record<string, any>, curr: Record<string, any>, domNode: HTMLElement | Text | ChildNode) {

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
    Object.keys(prev).filter(key => key.startsWith("on") && typeof curr[key] == "function" && !keys.includes(key))
        .forEach(key => {
            // dom.removeAttribute(key)
            if (!domNode?._listeners?.[key]) return
            domNode.removeEventListener(key.toLowerCase().substring(2), domNode?._listeners?.[key])
            delete domNode?._listeners?.[key]
            delete domNode?._handlers?.[key]
        })
}

function createListener(dom: DomElement, key: string) {
    if (dom._listeners == undefined) dom._listeners = {}

    const realListener = function(this: DomElement, event: Event) {
        const handler = (this)._handlers?.[key]
        if (handler) handler(event)
    }

    dom._listeners[key] = realListener

    dom.addEventListener(key.toLowerCase().substring(2), realListener)
}

function render(node: vnode, container: HTMLElement) {
    currContainer = container
    currVnode = node
    idGenerator.reset()
    recon(node, container)
    // container.replaceChildren(getElement(node))
}

export function reRender() {
    idGenerator.reset()
    if (!currVnode || !currContainer) return
    // if (currVnode != null) currContianer?.replaceChildren(getElement(currVnode))
    recon(currVnode, currContainer)
}

export default render
