import { makeRootFiber, performUnitOfWork, type fiberNode } from "./fiber"
import { endReconciliation } from "./render"
import type { Root } from "./root"
import { setRoot } from "./runtime_context"

const channel = new MessageChannel
const scheduled: Array<any> = []
const timesliceMs = 0.1

channel.port1.onmessage = function workloop({ data: id }) {
    if (!scheduled[id]) return
    let { fiber, root, renderVersion, renderRootFiber } = scheduled[id]
    delete scheduled[id]

    if (renderVersion != root.renderVersion) return

    setRoot(root)
    root.renderScheduled = 2


    var deadline = performance.now() + timesliceMs
    while (fiber && renderVersion == root.renderVersion) {
        fiber = performUnitOfWork(fiber)

        // yield to browser since timeslice ended
        if (deadline < performance.now() && fiber) {
            scheduleWork(fiber, root, renderVersion, renderRootFiber)
            return
        }
    }
    if (renderVersion != root.renderVersion) return
    endReconciliation(renderRootFiber, root)
}

function scheduleWork(fiber: fiberNode, root: Root, renderVersion: number, renderRootFiber: fiberNode) {
    scheduled.push({ fiber, root, renderVersion, renderRootFiber })
    channel.port2.postMessage(scheduled.length - 1)
}

export function scheduleRender(root: Root) {
    if (root.renderScheduled == 1) return
    root.renderScheduled = 1
    var rootFiber = makeRootFiber(root)
    scheduleWork(rootFiber, root, ++root.renderVersion, rootFiber)
}
