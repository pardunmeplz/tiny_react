import { commitPhase } from "./commits"
import { type hookSlot } from "./hooks"
import { diffingPhase, render, type vnode } from "./render"
import { setRoot } from "./runtime_context"

export interface Root {

    hookState: Record<string, Array<hookSlot | null>>
    renderScheduled: boolean
    componentTree: vnode | null
    snapshot: vnode | null
    effectQueue: Array<() => void>
}

export const runEffectQueue = (root: Root) => { while (root.effectQueue.length) root.effectQueue.shift()?.() }

export default function createRoot(container: HTMLElement) {
    const root: Root = {
        hookState: {},
        renderScheduled: false,
        snapshot: null,
        componentTree: null,
        effectQueue: [],
    }

    return {
        render: (node: vnode) => {
            setRoot(root)
            root.componentTree = node
            root.snapshot = render(root)

            const placeholder = document.createElement("div")
            container.append(placeholder)
            const commitQueue = diffingPhase({ type: "", props: {}, children: [], dom: placeholder }, root.snapshot)
            commitPhase(commitQueue)

            runEffectQueue(root)
        }
    }
}
