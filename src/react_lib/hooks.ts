import { currentRoot, getHookState, } from "./runtime_context";
import { scheduleRender } from "./scheduling";

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

    const [getSlot, setSlot] = getHookState({ hook: 0, state: x })

    const setter = (value: any) => {
        if (typeof value == "function") value = value(getSlot()?.state)
        setSlot({ hook: 0, state: value })
        scheduleRender(currentRoot)
    }

    return [getSlot()?.state, setter]
}

export function useEffect(effect: () => (() => void) | void, dependency?: Array<any>): void {

    const [getSlot, setSlot] = getHookState({ hook: 1 })

    if (!getSlot()?.deps || !dependency || getSlot()?.deps?.some((x: Array<any>, i: number) => dependency[i] != x)) {
        currentRoot.effectQueue.push(() => {
            setTimeout(() => {
                getSlot()?.cleanup?.()
                setSlot({
                    hook: 1,
                    deps: dependency,
                    cleanup: effect()
                })
            }, 0)
        })

    }
}

export function useLayoutEffect(effect: () => (() => void) | void, dependency?: Array<any>): void {

    const [getSlot, setSlot] = getHookState(undefined)

    if (!getSlot() || !dependency || getSlot()?.deps?.some((x: Array<any>, i: number) => dependency[i] != x)) {
        currentRoot.effectQueue.push(() => {
            getSlot()?.cleanup?.()
            setSlot({
                hook: 2,
                deps: dependency,
                cleanup: effect()
            })
        })

    }
}
