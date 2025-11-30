import constants from "./constants"
import idGenerator from "./idGenerator"
import { setComponent } from "./useState"

export type component = (prop: Record<string, any>) => vnode

export interface vnode {
    type: string | component
    props: Record<string, any>
    children: Array<vnode>
}

var currContianer: HTMLElement | null = null
var currVnode: vnode | null = null
export var currComponent: component | null = null


function getElement(node: vnode): HTMLElement | Text {
    // unique key setup
    if (node.props.key) {
        setComponent("" + node.props.key)
    } else {
        setComponent(idGenerator.getId())
    }

    if (node.type == constants.Element_Text_NODE) return document.createTextNode(node.props.nodeValue)
    node = evaluateComponent(node)

    return createDomElement(node)
}

function evaluateComponent(node: vnode): vnode {
    if (typeof node.type != "function") return node

    currComponent = node.type
    return node.type({ ...node.props, children: node.children })
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

    idGenerator.addChild()
    node.children.forEach((x, i) => {
        idGenerator.replace(i)
        element.append(getElement(x))
    })
    idGenerator.dropChild()

    return element
}

function render(node: vnode, container: HTMLElement) {
    currContianer = container
    currVnode = node
    idGenerator.reset()
    container.replaceChildren(getElement(node))
}

export function reRender() {
    idGenerator.reset()
    if (currVnode != null) currContianer?.replaceChildren(getElement(currVnode))
}

export default render
