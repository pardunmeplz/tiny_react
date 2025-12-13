import constants from "./constants"
import { createListener, updateProps } from "./updateProperties"
import { componentId, setComponent, unmountState } from "./useState"

export type component = (prop: Record<string, any>) => vnode

export interface vnode {
    type: string | component
    props: Record<string, any>
    children: Array<vnode>
    id?: string
    dom?: DomElement
}

var currContainer: HTMLElement | null = null
var currVnode: vnode | null = null
export var currComponent: component | null = null

export type DomElement = (HTMLElement | ChildNode | Text) & {
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

function renderComponent(node: vnode): vnode {

    const parentComponent = currComponent
    const parentId = componentId
    if (typeof node.type == "function") {

        setComponent(idGenerator.getId())

        currComponent = node.type
        node = node.type({ ...node.props, children: node.children })
    }

    node.id = idGenerator.getId()

    idGenerator.addChild()
    node.children = node.children.map((child, i) => {

        var type = getTypeString(child)

        if (child.props.key) {
            idGenerator.replace(child.props.key + i)
        } else {
            idGenerator.replace(type + i)
        }
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

    if (!snapshot || !snapshot?.dom) {
        snapshot = snapshot_new // uncomment to start diffing instead of full dom re-renders
        container.replaceChildren(createElement(snapshot_new))
        return
    }

    commit(snapshot, snapshot_new)
    snapshot = snapshot_new
}

function commit(prev: vnode, curr: vnode) {

    // check type
    if (prev.type != curr.type) {
        if (prev.id) unmountState(prev.id)
        const newDom = createElement(curr)
        prev?.dom?.replaceWith(newDom)
        return newDom
    }

    // check text nodes
    if (prev.type == constants.Element_Text_NODE && prev.props.nodeValue != curr.props.nodeValue) {
        (prev.dom as Text).nodeValue = curr.props.nodeValue
        return prev.dom!
    }

    // update props
    updateProps(prev.props, curr.props, prev.dom!)


    curr.dom = prev.dom // we have confirmed this node is not re-rendered
    let deleteArr: Array<vnode | null> = [...prev.children]

    // todo: you need to check changes in index between old and new children and reorder dom accordingly
    curr.children.forEach((currChild, i) => {

        // matching dom nodes scenario
        if (deleteArr.length > i && currChild.id == deleteArr[i]?.id) {
            commit(deleteArr.splice(i, 1, null)[0]!, currChild)
            return
        }

        const prevIndex = deleteArr.findIndex(old => currChild.id == old?.id)

        // reorder scenario
        if (prevIndex != -1) {
            commit(deleteArr.splice(prevIndex, 1, null)[0]!, currChild)
            return
        }

        // new dom element mount scenario
        if (deleteArr.length <= i) {
            const element = createElement(currChild)
            prev.dom?.appendChild(element)
            // deleteArr.splice(index, 0, null)
            return

        }

        commit(deleteArr.splice(i, 1, null)[0]!, currChild)
    })

    deleteArr.forEach(node => node?.id ? unmountState(node.id) : null)
    deleteArr.map((val, i) => !val ? null : prev.dom?.childNodes[i]).forEach(child => child ? prev.dom?.removeChild(child) : null)

}

function render(node: vnode, container: HTMLElement) {
    currContainer = container
    currVnode = node
    idGenerator.reset()
    recon(node, container)
    // container.replaceChildren(getElement(node))
}

function getTypeString(node: vnode): string {
    if (typeof node.type == "function") return node.type.name
    return node.type
}

export function reRender() {
    idGenerator.reset()
    if (!currVnode || !currContainer) return
    // if (currVnode != null) currContianer?.replaceChildren(getElement(currVnode))
    recon(currVnode, currContainer)
}

export default render
