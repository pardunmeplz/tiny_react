// import { commitPhase } from "./commits"
import type { fiberNode } from "./fiber"
import { type hookSlot } from "./hooks"
import { beginReconciliation, type vnode } from "./render"
import { setRoot } from "./runtime_context"

export interface Root {
    componentId: string
    hookCount: number
    hookState: Record<string, Array<hookSlot | null>>
    renderScheduled: boolean
    componentTree?: vnode
    snapshot: vnode | null
    effectQueue: Array<() => void>
    fiber?: fiberNode
}

export const runEffectQueue = (root: Root) => { while (root.effectQueue.length) root.effectQueue.shift()?.() }

export default function createRoot(container: HTMLElement) {
    const root: Root = {
        componentId: "",
        hookCount: 0,
        hookState: {},
        renderScheduled: false,
        snapshot: null,
        effectQueue: [],
    }

    return {
        render: (node: vnode) => {
            setRoot(root)
            root.componentTree = node

            const placeholder = document.createElement("div")
            container.append(placeholder)
            root.fiber = { phase: 2, node: { type: "", props: {}, children: [], dom: placeholder }, index: 0, effects: [] }

            // root.snapshot = render(root)
            beginReconciliation(root)


            // const commitQueue = diffingPhase(, root.snapshot)
            // commitPhase(commitQueue)

            // runEffectQueue(root)
        }
    }
}
