import constants from "./constants"
import idGenerator from "./idGenerator"
import { setComponent } from "./useState"

export type component = (prop: Record<string, any>) => vnode

export interface vnode {
    type: string | component
    props: Record<string, any>
    children: Array<vnode>
}

var currContainer: HTMLElement | null = null
var currVnode: vnode | null = null
export var currComponent: component | null = null


var snapshot: vnode | null = null


function getElement(node: vnode): HTMLElement | Text {
    // unique key setup
    if (node.props.key) {
        setComponent("" + node.props.key)
    } else {
        setComponent(idGenerator.getId())
    }

    if (node.type == constants.Element_Text_NODE) return document.createTextNode(node.props.nodeValue)

    return createDomElement(node)
}

function evaluateComponents(node: vnode): vnode {
    // unique key setup
    if (node.props.key) {
        setComponent("" + node.props.key)
    } else {
        setComponent(idGenerator.getId())
    }

    if (typeof node.type == "function") {
        currComponent = node.type
        node = node.type({ ...node.props, children: node.children })
    }
    node.children = node.children.map(child => evaluateComponents(child))
    return node
}

function createDomElement(node: vnode): HTMLElement | Text {

    const element = document.createElement(node.type as string)
    Object.keys(node.props).forEach((key) => {
        if (key.startsWith("on") && typeof node.props[key] == "function") {
            // all event listners will start with on
            element.addEventListener(key.toLowerCase().substring(2), node.props[key])
        } else {
            element.setAttribute(key, node.props[key])
        }
    })

    element.setAttribute("vdom-id", idGenerator.getId())

    idGenerator.addChild()

    node.children.forEach((x, i) => {
        idGenerator.replace(i)
        element.append(getElement(x))
    })

    idGenerator.dropChild()

    return element
}

function recon(node: vnode, container: HTMLElement) {
    const snapshot_new = evaluateComponents(node)

    if (!snapshot) {
        // snapshot = snapshot_new
        container.replaceChildren(getElement(snapshot_new))
        return
    }

    // snapshot = snapshot_new
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
