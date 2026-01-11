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
    effectQueue: Array<() => void>
    rootFiber?: fiberNode
    currentFiber?: fiberNode
    renderVersion: number

    renderScheduled: 0 | 1 | 2 // unscheduled | scheduled | inprogress
}

export const runEffectQueue = (root: Root) => { while (root.effectQueue.length) root.effectQueue.shift()?.() }

export default function createRoot(container: HTMLElement) {
    const root: Root = {
        hookCount: 0,
        hookState: new WeakMap,
        renderScheduled: 0,
        snapshot: null,
        effectQueue: [],
        renderVersion: 0
    }

    return {
        render: (node: vnode) => {
            setRoot(root)
            root.componentTree = node

            const placeholder = document.createElement("div")
            container.append(placeholder)
            root.rootFiber = { phase: 2, node: { type: "", props: {}, children: [], dom: placeholder }, index: 0, effects: [] }

            scheduleRender(root)
        }
    }
}
