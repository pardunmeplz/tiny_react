import constants from "./constants"
import { commitPhase, type DomElement } from "./commits"
import { type Root } from "./root"
import { currentRoot, newComponentBoundary } from "./runtime_context"
import { propsDiff } from "./updateProperties"
import { type fiberNode } from "./fiber"

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
        unit.boundaryContext = newComponentBoundary(unit)
        out = unit.node.type({ ...unit.node.props, children: unit.node.children })
    }

    return out
}

export function diff(unit: fiberNode): void {
    const out = unit.commits
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
        // if (unit.alternate?.id) {
        // }
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

const runEffectQueue = (fiber: fiberNode) => { while (fiber.effects.length) fiber.effects.shift()?.() }

export function endReconciliation(unit: fiberNode, root: Root) {
    commitPhase(unit.commits)
    root.snapshot = unit.node
    root.rootFiber = unit
    runEffectQueue(unit)
    currentRoot.renderScheduled = 0
}
