// import { commitPhase } from "./commits"
import type { fiberNode } from "./fiber"
import { type hookSlot } from "./hooks"
import { type vnode } from "./render"
import { setRoot } from "./runtime_context"
import { scheduleRender } from "./scheduling"

export interface Root {
    hookCount: number
    hookState: WeakMap<fiberNode, Array<hookSlot | undefined>>
    componentTree?: vnode
    snapshot: vnode | null
    rootFiber?: fiberNode
    currentFiber?: fiberNode
    renderVersion: number

    renderScheduled: 0 | 1 | 2 // unscheduled | scheduled | inprogress
}


export default function createRoot(container: HTMLElement) {
    const root: Root = {
        hookCount: 0,
        hookState: new WeakMap,
        renderScheduled: 0,
        snapshot: null,
        renderVersion: 0
    }

    return {
        render: (node: vnode) => {
            setRoot(root)
            root.componentTree = node
            console.log("nodes", node)

            const placeholder = document.createElement("div")
            container.append(placeholder)
            root.rootFiber = { phase: 2, node: { type: "", props: {}, children: [], dom: placeholder }, index: 0, commits: [], effects: [] }

            scheduleRender(root)
        }
    }
}
