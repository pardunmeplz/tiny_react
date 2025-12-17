import { reRender } from "./render";

const globalState: Record<string, Array<any>> = {}
var hookCount = 0
export var componentId: string | null = null
var effectQueue: Array<() => void> = []

function getGlobalState(x: any): [string, number] {
    if (componentId == null) throw Error("Hooks can only be used inside a component")
    const id = componentId
    const index = hookCount++

    // add missing component entry
    if (!Object.hasOwn(globalState, id)) {
        globalState[id] = []
    }

    // add missing state entry
    if (globalState[id].length <= index) {
        globalState[id].push(x)
    }
    return [id, index]
}

function useState(x: any): [any, (value: any) => void] {

    const [id, index] = getGlobalState(x)

    const setter = (value: any) => {
        queueMicrotask(() => {
            if (typeof value == "function") value = value(globalState[id][index])
            globalState[id][index] = value
            reRender()
        })
    }

    return [globalState[id][index], setter]
}

export function useEffect(effect: () => (() => void) | void, dependency: Array<any>): void {

    const [id, index] = getGlobalState(null)

    if (globalState[id][index] == null || globalState[id][index]?.deps?.findIndex((x: Array<any>, i: number) => dependency?.[i] != x) != -1) {
        effectQueue.push(() => {
            globalState[id][index]?.cleanup?.()
            globalState[id][index] = {
                hook: 1, // useeffect hook id
                deps: [...dependency],
                cleanup: effect()
            }
        })

    }
}

export default useState

// renderer will call this when starting any new component
export function setComponent(id: string) {
    hookCount = 0
    componentId = id
}

export function runEffectQueue() {
    while (effectQueue.length) effectQueue.pop()?.()
}

export function unmountState(componentId: string) {
    globalState[componentId].forEach(x => {
        if (x?.hook == 1 && x?.cleanup) effectQueue.push(x?.cleanup)
    })
    delete globalState[componentId]
}
