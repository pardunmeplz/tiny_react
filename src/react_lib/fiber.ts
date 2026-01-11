import type { OpCode } from "./commits";
import { diff, endReconciliation, evaluate, type vnode } from "./render";
import type { Root } from "./root";
import type { componentBoundaryContext } from "./runtime_context";


export interface fiberNode {
    phase: 0 | 1 | 2 // todo / begun / finished
    node: vnode
    alternate?: fiberNode
    parent?: fiberNode
    child?: fiberNode
    sibling?: fiberNode
    effects: Array<OpCode>
    index: number
    id?: string
    boundaryContext?: componentBoundaryContext
}

export function workloop(fiber: fiberNode, root: Root, renderVersion: number) {
    let curr: fiberNode | undefined = fiber
    // this is the cursor traversal, currently with no yielding
    // but now instead of an uninteruptable stack recursion, we can yield
    // at any point, storing the cursor value in some schedular object before yield
    // and then later continue from where we left off with the next unit of work 
    // using the cursor
    while (curr && renderVersion == root.renderVersion) {
        curr = performUnitOfWork(curr)
    }
    if (renderVersion != root.renderVersion) return
    endReconciliation(fiber, root)
}

// returns next unit of work
export function performUnitOfWork(unit: fiberNode) {
    // var node = evaluate(unit.node)
    if (unit.phase == 0) {

        beginWork(unit)
        unit.phase = 1
        if (unit.child?.phase == 1 || unit.child?.phase == 0) return unit.child
        return unit;
    } else if (unit.phase == 1) {

        // bubbling up changes here
        completeWork(unit)
        unit.phase = 2
        if (unit.sibling?.phase == 1 || unit.sibling?.phase == 0) return unit.sibling
        return unit.parent
    }
}

function beginWork(unit: fiberNode) {
    unit.node = evaluate(unit)
    diff(unit)
    makeChildFibers(unit)
}

function completeWork(unit: fiberNode) {
    for (let curr = unit.child; curr; curr = curr.sibling) {
        unit.effects.push(...curr.effects)
        if (curr.index != curr.alternate?.index) unit.effects.push({ code: "insert", index: curr.index, curr: curr.node, prev: unit.node })
    }
    unit?.boundaryContext?.endBoundary()
}

function makeChildFibers(unit: fiberNode) {
    // gather all alternate child fibers
    const alternates: Array<fiberNode> = []
    let curr = unit.alternate?.child
    while (curr) {
        alternates.push(curr)
        curr = curr.sibling
    }

    // trailing created child fiber to link as sibling with current fiber
    let prevNode: fiberNode | undefined = undefined
    unit.node.children.forEach((child, i) => {

        const id = (unit.id)
            + "." + getTypeString(child)
            + "." + (child.props?.key ? child.props?.key : i)

        const alternateIndex = alternates.findIndex(alt => id == alt.id)
        let alternate: fiberNode | undefined = undefined
        if (alternateIndex != -1) {
            alternate = alternates.splice(alternateIndex, 1)[0]
        }
        const fiber: fiberNode = {
            phase: 0,
            parent: unit,
            node: child,
            alternate,
            effects: [],
            index: i,
            id
        }
        if (!prevNode) unit.child = fiber
        else prevNode.sibling = fiber
        prevNode = fiber
    })
    alternates.forEach(node => {
        unit.effects.push({ code: "remove", curr: node.node, prev: unit.alternate?.node })
    })
}

export function makeRootFiber(root: Root): fiberNode {
    return {
        phase: 0,
        node: root.componentTree!,
        alternate: root.rootFiber,
        effects: [],
        index: 0,
        id: "0." + getTypeString(root.componentTree!) + ".0"
    }
}

function getTypeString(node: vnode): string {
    if (typeof node.type == "function") return node.type.name
    return node.type
}
