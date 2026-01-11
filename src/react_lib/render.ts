import constants from "./constants"
import { commitPhase, type DomElement } from "./commits"
import { runEffectQueue, type Root } from "./root"
import { currentRoot, newComponentBoundary, setRoot } from "./runtime_context"
import { propsDiff } from "./updateProperties"
import { makeRootFiber, workloop, type fiberNode } from "./fiber"

export type component = (prop: Record<string, any>) => vnode

export interface vnode {
    type: string | component
    props: Record<string, any>
    children: Array<vnode>
    dom?: DomElement
}

export function evaluate(unit: fiberNode) {
    let out = { ...unit.node }

    if (typeof unit.node.type == "function") {
        unit.boundaryContext = newComponentBoundary(unit.id!)
        out = unit.node.type({ ...unit.node.props, children: unit.node.children })
    }

    return out
}

export function diff(unit: fiberNode): void {
    const out = unit.effects
    const prev = unit.alternate?.node
    const curr = unit.node

    if (!prev) {
        out.push({ code: curr.type == constants.Element_Text_NODE ? "createText" : "create", curr })
        out.push({ code: "append", curr: curr, prev: unit.parent?.node })
        out.push(...propsDiff({ type: "", props: {}, children: [] }, curr))
        return
    }

    // check type
    if (prev.type != curr.type) {
        if (unit.alternate?.id) {
            console.log(unit.alternate?.id, unit)
            out.push({ code: "del_state", id: unit.alternate.id })
        }
        out.push({ code: curr.type == constants.Element_Text_NODE ? "createText" : "create", curr })
        out.push({ code: "replace", prev, curr })
        out.push(...propsDiff({ type: "", props: {}, children: [] }, curr))
        return
    }

    // check text nodes
    if (prev.type == constants.Element_Text_NODE && prev.props.nodeValue != curr.props.nodeValue) {
        out.push({ code: "setCurr", prev, curr }) // reuse same text node
        out.push({ code: "upd_prop", key: "nodeValue", curr })// update node value
        return
    }

    // we have confirmed this node is not re-rendered
    out.push({ code: "setCurr", prev, curr })//pushToCommit({ code: "setAasB", A: curr, B: prev })

    // update props
    out.push(...propsDiff(prev, curr))// pushToCommit({ code: "updatePropsB", A: curr, B: prev })
}

export function beginReconciliation(root: Root) {
    setRoot(root)
    currentRoot.renderScheduled = false
    workloop(makeRootFiber(root), root)
}

export function endReconciliation(unit: fiberNode, root: Root) {
    console.log(unit.effects)
    commitPhase(unit.effects)
    root.snapshot = unit.node
    root.fiber = unit
    runEffectQueue(root)
}

// export function render(root: Root) {
//     const idGenerator = {
//         id: ["0"],
//         getId: function() { return this.id.reduce((a, b) => a + "." + b, "") },
//         replace: function(id: string) { this.id[this.id.length - 1] = id },
//         addChild: function() { this.id.push("0") },
//         dropChild: function() { this.id.pop() },
//         reset: function() { this.id = ["0"] }
//     }

//     const evaluate = (node: vnode): vnode => {

//         let out = { ...node }

//         let boundaryContext = null
//         if (typeof node.type == "function") {
//             boundaryContext = newComponentBoundary(idGenerator.getId())
//             out = node.type({ ...node.props, children: node.children })
//         }

//         out.id = idGenerator.getId()

//         idGenerator.addChild()
//         out.children = out.children.map((child, i) => {

//             let type = getTypeString(child)

//             if (child.props.key) {
//                 idGenerator.replace(type + child.props.key)
//             } else {
//                 idGenerator.replace(type + i)
//             }
//             return evaluate(child)
//         })
//         idGenerator.dropChild()

//         // return to parent boundary at end of component evaluation 
//         boundaryContext?.endBoundary()

//         return out
//     }
//     return evaluate(root.componentTree!)
// }

// export function reconciliation(root: Root) {
//     if (!root.snapshot) throw new Error("Missing snapshot of last render")
//     setRoot(root)
//     currentRoot.renderScheduled = false
//     const snapshot_new = render(root)
//     const commitQueue = diffingPhase(root.snapshot, snapshot_new)
//     commitPhase(commitQueue)
//     root.snapshot = snapshot_new
//     runEffectQueue(root)
// }


// export function diffingPhase(prev: vnode, curr: vnode): Array<OpCode> {
//     const out: Array<OpCode> = []

//     // check type
//     if (prev.type != curr.type) {
//         if (prev.id) out.push({ code: "del_state", prev })
//         out.push({ code: curr.type == constants.Element_Text_NODE ? "createText" : "create", curr })
//         out.push({ code: "replace", prev, curr })
//         out.push(...propsDiff({ type: "", props: {}, children: [] }, curr))
//         out.push(...diffChildren(prev, curr))
//         return out
//     }

//     // check text nodes
//     if (prev.type == constants.Element_Text_NODE && prev.props.nodeValue != curr.props.nodeValue) {
//         out.push({ code: "setCurr", prev, curr }) // reuse same text node
//         out.push({ code: "upd_prop", key: "nodeValue", curr })// update node value
//         return out
//     }

//     // we have confirmed this node is not re-rendered
//     out.push({ code: "setCurr", prev, curr })//pushToCommit({ code: "setAasB", A: curr, B: prev })

//     // update props
//     out.push(...propsDiff(prev, curr))// pushToCommit({ code: "updatePropsB", A: curr, B: prev })

//     out.push(...diffChildren(prev, curr))

//     return out
// }

// function diffChildren(prev: vnode, curr: vnode): Array<OpCode> {
//     const out: Array<OpCode> = []
//     let deleteArr: Array<vnode | null> = [...prev.children]

//     curr.children.forEach((currChild, i) => {

//         // matching dom nodes scenario
//         if (deleteArr.length > i && currChild.id == deleteArr[i]?.id) {
//             out.push(...diffingPhase(deleteArr.splice(i, 1, null)[0]!, currChild))
//             return
//         }

//         const prevIndex = deleteArr.findIndex(old => currChild.id == old?.id)

//         // reorder scenario
//         if (prevIndex != -1) {
//             if (i < prevIndex) {
//                 out.push({ code: "insert", curr: deleteArr[prevIndex]!, prev: curr, index: i })//pushToCommit({ code: "insertAinB", A: deleteArr[prevIndex]!, B: prev, index: i })
//             } else if (prev.children.length ?? -1 > i + 1) {
//                 out.push({ code: "insert", curr: deleteArr[prevIndex]!, prev: curr, index: i + 1 })//pushToCommit({ code: "insertAinB", A: deleteArr[prevIndex]!, B: prev, index: i + 1 })
//             } else {
//                 deleteArr[prevIndex] && out.push({ code: "append", curr: deleteArr[prevIndex], prev })//pushToCommit({ code: "appendAtoB", A: deleteArr[prevIndex], B: prev })
//             }
//             out.push(...diffingPhase(deleteArr.splice(prevIndex, 1, null)[0]!, currChild))
//             return
//         }

//         // new dom element mount scenario
//         if (deleteArr.length <= i) {
//             out.push({ code: currChild.type == constants.Element_Text_NODE ? "createText" : "create", curr: currChild })
//             out.push({ code: "append", curr: currChild, prev: curr })//pushToCommit({ code: "appendAtoB", A: currChild, B: prev })
//             out.push(...propsDiff({ type: "", props: {}, children: [] }, currChild))
//             return

//         }

//         out.push(...diffingPhase(deleteArr.splice(i, 1, null)[0]!, currChild))
//     })

//     deleteArr.forEach(node => {
//         node?.id && out.push({ code: "del_state", prev: node })//unmountState(node.id)
//         node && out.push({ code: "remove", curr: node, prev })//pushToCommit({ code: "removeAfromB", A: node, B: prev })
//     })
//     return out
// }
