import constants from "./constants"
import { createTextNode } from "./createElement"
import { setComponent, componentId } from "./useState"

export type component = (prop: Record<string, any>) => vnode

export interface vnode {
    type: string
    props: Record<string, any>
    children: Array<vnode | component | string | number>
}


var currContianer: HTMLElement | null = null
var currComponent: component | null = null

var componentIdCounter = 0

function getElement(node: vnode): HTMLElement | Text {
    const id = componentId!
    switch (node.type) {
        case constants.Element_Text_NODE:
            return document.createTextNode(node.props.nodeValue)
    }

    const element = document.createElement(node.type)
    Object.keys(node.props).forEach((key) => {
        if (key.startsWith("on") && typeof node.props[key] == "function") {
            // all event listners will start with on
            element.addEventListener(key.toLowerCase().substring(2), node.props[key])
        } else {
            element.setAttribute(key, node.props[key])
        }
    })

    node.children.forEach((x) => {
        switch (typeof x) {
            case "string":
            case "number":
                element.append(getElement(createTextNode(x)))
                break
            case "function":
                setComponent(++componentIdCounter)
                element.append(getElement(x({})))
                setComponent(id)
                break
            case "object":
                element.append(getElement(x))
                break

        }
    })
    return element
}

function render(component: component, container: HTMLElement) {
    currContianer = container
    currComponent = component
    componentIdCounter = 0
    setComponent(++componentIdCounter)
    container.replaceChildren(getElement(component({})))
}

export function reRender() {
    componentIdCounter = 0
    setComponent(++componentIdCounter)
    if (currComponent != null) currContianer?.replaceChildren(getElement(currComponent({})))
}

export default render
