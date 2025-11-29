import constants from "./constants"

export interface vnode {
    type: string
    props: Record<string, any>
    children: Array<vnode>
}

function getElement(node: vnode): HTMLElement | Text {
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

    node.children.forEach((x) => { element.append(getElement(x)) })
    return element
}

function render(node: vnode, container: HTMLElement) {
    container.replaceChildren(getElement(node))
}

export default render
