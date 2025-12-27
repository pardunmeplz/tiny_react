import constants from "./constants"
import { componentId, runEffectQueue, setComponent, unmountState } from "./hooks"
import { clearCommit, commitPhase, pushToCommit, type DomElement } from "./commits"

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

var snapshot: vnode | null = null

const idGenerator = {
    id: ["0"],
    getId: function() { return this.id.reduce((a, b) => a + "." + b, "") },
    replace: function(id: string) { this.id[this.id.length - 1] = id },
    addChild: function() { this.id.push("0") },
    dropChild: function() { this.id.pop() },
    reset: function() { this.id = ["0"] }
}

function renderPhase(node: vnode): vnode {

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
            idGenerator.replace(type + child.props.key)
        } else {
            idGenerator.replace(type + i)
        }
        return renderPhase(child)
    })
    idGenerator.dropChild()

    // return to parent boundary at end of component evaluation 
    currComponent = parentComponent
    if (parentId) setComponent(parentId)

    return node
}

function reconciliation(node: vnode, container: HTMLElement) {
    const snapshot_new = renderPhase(node)
    clearCommit()

    if (!snapshot || !snapshot?.dom) {
        pushToCommit({ code: "createA", A: snapshot_new })
        pushToCommit({ code: "replaceB", A: snapshot_new, B: { type: "", props: {}, children: [], dom: container } })
        // container.replaceChildren(createElement(snapshot_new))
        snapshot = snapshot_new
        commitPhase()
        runEffectQueue()
        return
    }

    diffingPhase(snapshot, snapshot_new)
    commitPhase()
    snapshot = snapshot_new
    runEffectQueue()
}

function diffingPhase(prev: vnode, curr: vnode) {

    // check type
    if (prev.type != curr.type) {
        if (prev.id) unmountState(prev.id)
        pushToCommit({ code: "createA", A: curr })
        pushToCommit({ code: "replaceB", A: curr, B: prev })
        return
    }

    // check text nodes
    if (prev.type == constants.Element_Text_NODE && prev.props.nodeValue != curr.props.nodeValue) {
        pushToCommit({ code: "updateTextNodeB", B: prev, A: curr })
        return
    }

    // update props
    pushToCommit({ code: "updatePropsB", A: curr, B: prev })


    // we have confirmed this node is not re-rendered
    pushToCommit({ code: "setAasB", A: curr, B: prev })
    let deleteArr: Array<vnode | null> = [...prev.children]

    curr.children.forEach((currChild, i) => {

        // matching dom nodes scenario
        if (deleteArr.length > i && currChild.id == deleteArr[i]?.id) {
            diffingPhase(deleteArr.splice(i, 1, null)[0]!, currChild)
            return
        }

        const prevIndex = deleteArr.findIndex(old => currChild.id == old?.id)

        // reorder scenario
        if (prevIndex != -1) {
            if (i < prevIndex) {
                pushToCommit({ code: "insertAinB", A: deleteArr[prevIndex]!, B: prev, index: i })
            } else if (prev.children.length ?? -1 > i + 1) {
                pushToCommit({ code: "insertAinB", A: deleteArr[prevIndex]!, B: prev, index: i + 1 })
            } else {
                deleteArr[prevIndex] && pushToCommit({ code: "appendAtoB", A: deleteArr[prevIndex], B: prev })
            }
            diffingPhase(deleteArr.splice(prevIndex, 1, null)[0]!, currChild)
            return
        }

        // new dom element mount scenario
        if (deleteArr.length <= i) {
            pushToCommit({ code: "createA", A: currChild })
            pushToCommit({ code: "appendAtoB", A: currChild, B: prev })
            return

        }

        diffingPhase(deleteArr.splice(i, 1, null)[0]!, currChild)
    })

    deleteArr.forEach(node => {
        node?.id && unmountState(node.id)
        node && pushToCommit({ code: "removeAfromB", A: node, B: prev })
    })

}

function render(node: vnode, container: HTMLElement) {
    currContainer = container
    currVnode = node
    idGenerator.reset()
    reconciliation(node, container)
}

function getTypeString(node: vnode): string {
    if (typeof node.type == "function") return node.type.name
    return node.type
}

export function reRender() {
    idGenerator.reset()
    if (!currVnode || !currContainer) return
    reconciliation(currVnode, currContainer)
}

export default render
