import constants from "./constants"
import { commitPhase, type DomElement, type OpCode } from "./commits"
import { runEffectQueue, type Root } from "./root"
import { currentRoot, newComponentBoundary, setRoot } from "./runtime_context"
import { propsDiff } from "./updateProperties"

export type component = (prop: Record<string, any>) => vnode

export interface vnode {
    type: string | component
    props: Record<string, any>
    children: Array<vnode>
    id?: string
    dom?: DomElement
}

export function render(root: Root) {
    const idGenerator = {
        id: ["0"],
        getId: function() { return this.id.reduce((a, b) => a + "." + b, "") },
        replace: function(id: string) { this.id[this.id.length - 1] = id },
        addChild: function() { this.id.push("0") },
        dropChild: function() { this.id.pop() },
        reset: function() { this.id = ["0"] }
    }

    const evaluate = (node: vnode): vnode => {

        var out = { ...node }

        var boundaryContext = null
        if (typeof node.type == "function") {
            boundaryContext = newComponentBoundary(idGenerator.getId())
            out = node.type({ ...node.props, children: node.children })
        }

        out.id = idGenerator.getId()

        idGenerator.addChild()
        out.children = out.children.map((child, i) => {

            var type = getTypeString(child)

            if (child.props.key) {
                idGenerator.replace(type + child.props.key)
            } else {
                idGenerator.replace(type + i)
            }
            return evaluate(child)
        })
        idGenerator.dropChild()

        // return to parent boundary at end of component evaluation 
        boundaryContext?.endBoundary()

        return out
    }
    return evaluate(root.componentTree!)
}

export function reconciliation(root: Root) {
    if (!root.snapshot) throw new Error("Missing snapshot of last render")
    setRoot(root)
    currentRoot.renderScheduled = false
    const snapshot_new = render(root)

    commitPhase(diffingPhase(root.snapshot, snapshot_new))
    root.snapshot = snapshot_new
    runEffectQueue(root)
}

export function diffingPhase(prev: vnode, curr: vnode): Array<OpCode> {
    const out: Array<OpCode> = []

    // check type
    if (prev.type != curr.type) {
        if (prev.id) out.push({ code: "del_state", prev })
        out.push({ code: curr.type == constants.Element_Text_NODE ? "createText" : "create", curr })
        out.push({ code: "replace", prev, curr })
        out.push(...propsDiff({ type: "", props: {}, children: [] }, curr))
        out.push(...diffChildren(prev, curr))
        return out
    }

    // check text nodes
    if (prev.type == constants.Element_Text_NODE && prev.props.nodeValue != curr.props.nodeValue) {
        out.push({ code: "upd_prop", key: "nodeValue", curr })//pushToCommit({ code: "updateTextNodeB", B: prev, A: curr })
        return out
    }

    // update props
    out.push(...propsDiff(prev, curr))// pushToCommit({ code: "updatePropsB", A: curr, B: prev })

    // we have confirmed this node is not re-rendered
    out.push({ code: "setCurr", prev, curr })//pushToCommit({ code: "setAasB", A: curr, B: prev })

    out.push(...diffChildren(prev, curr))

    return out
}

function diffChildren(prev: vnode, curr: vnode): Array<OpCode> {
    const out: Array<OpCode> = []
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
                out.push({ code: "insert", curr: deleteArr[prevIndex]!, prev, index: i })//pushToCommit({ code: "insertAinB", A: deleteArr[prevIndex]!, B: prev, index: i })
            } else if (prev.children.length ?? -1 > i + 1) {
                out.push({ code: "insert", curr: deleteArr[prevIndex]!, prev, index: i + 1 })//pushToCommit({ code: "insertAinB", A: deleteArr[prevIndex]!, B: prev, index: i + 1 })
            } else {
                deleteArr[prevIndex] && out.push({ code: "append", curr: deleteArr[prevIndex], prev })//pushToCommit({ code: "appendAtoB", A: deleteArr[prevIndex], B: prev })
            }
            diffingPhase(deleteArr.splice(prevIndex, 1, null)[0]!, currChild)
            return
        }

        // new dom element mount scenario
        if (deleteArr.length <= i) {
            out.push({ code: currChild.type == constants.Element_Text_NODE ? "createText" : "create", curr: currChild })
            out.push({ code: "append", curr: currChild, prev: curr })//pushToCommit({ code: "appendAtoB", A: currChild, B: prev })
            out.push(...propsDiff({ type: "", props: {}, children: [] }, currChild))
            return

        }

        diffingPhase(deleteArr.splice(i, 1, null)[0]!, currChild)
    })

    deleteArr.forEach(node => {
        node?.id && out.push({ code: "del_state", prev: node })//unmountState(node.id)
        node && out.push({ code: "del_state", curr: node, prev })//pushToCommit({ code: "removeAfromB", A: node, B: prev })
    })
    return out
}

function getTypeString(node: vnode): string {
    if (typeof node.type == "function") return node.type.name
    return node.type
}

export default render
