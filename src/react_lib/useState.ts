import { reRender } from "./render";

const globalState: Record<string, Array<any>> = {}
var hookCount = 0
export var componentId: string | null = null

function useState(x: any): [any, (value: any) => void] {
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

    const setter = (value: any) => {
        queueMicrotask(() => {
            if (typeof value == "function") value = value(globalState[id][index])
            globalState[id][index] = value
            reRender()
        })
    }

    return [globalState[id][index], setter]
}

export default useState

// renderer will call this when starting any new component
export function setComponent(id: string) {
    hookCount = 0
    componentId = id
}

export function unmountState(componentId: string) {
    delete globalState[componentId]
}
