import { reconciliation } from "./render";
import { currentRoot, getHookIndex, getHookSlot, setHookSlot } from "./runtime_context";

// 0 = usestate
// 1 = useeffect
// 2 = useLayoutEffect
export interface hookSlot {
    hook: 0 | 1 | 2,
    deps?: Array<any>,
    cleanup?: void | (() => void),
    state?: any
}

export function useState(x: any): [any, (value: any) => void] {

    const id = getHookIndex({ hook: 0, state: x })

    const setter = (value: any) => {
        if (typeof value == "function") value = value(getHookSlot(id)?.state)
        setHookSlot(id, { hook: 0, state: value })
        if (!currentRoot.renderScheduled) {
            currentRoot.renderScheduled = true
            setTimeout(() => {
                reconciliation(currentRoot)
            }, 0)
        }
    }

    return [getHookSlot(id)?.state, setter]
}

export function useEffect(effect: () => (() => void) | void, dependency?: Array<any>): void {

    const id = getHookIndex({ hook: 1 })

    if (!getHookSlot(id)?.deps || !dependency || getHookSlot(id)?.deps?.some((x: Array<any>, i: number) => dependency[i] != x)) {
        currentRoot.effectQueue.push(() => {
            setTimeout(() => {
                getHookSlot(id)?.cleanup?.()
                setHookSlot(id, {
                    hook: 1,
                    deps: dependency,
                    cleanup: effect()
                })
            }, 0)
        })

    }
}

export function useLayoutEffect(effect: () => (() => void) | void, dependency?: Array<any>): void {

    const id = getHookIndex(null)

    if (getHookSlot(id) == null || !dependency || getHookSlot(id)?.deps?.findIndex((x: Array<any>, i: number) => dependency[i] != x) != -1) {
        currentRoot.effectQueue.push(() => {
            getHookSlot(id)?.cleanup?.()
            setHookSlot(id, {
                hook: 2,
                deps: dependency,
                cleanup: effect()
            })
        })

    }
}
