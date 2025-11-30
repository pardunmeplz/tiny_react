import { currComponent, reRender, type component } from "./render";

// {componentId: [[state,state,state],componentPointer]}
const globalState: Record<string, [Array<any>, component | null]> = {}
var hookCount = 0
export var componentId: string | null = null

function useState(x: any): [any, (value: any) => void] {
    if (componentId == null) throw Error("Hooks can only be used inside a component")
    const id = componentId
    const index = hookCount++

    // add missing component entry
    if (!Object.hasOwn(globalState, id) || globalState[id][1] != currComponent) {
        globalState[id] = [[x], currComponent]
    }

    // add missing state entry
    if (globalState[id][0].length <= index) {
        globalState[id][0].push(x)
    }

    const setter = (value: any) => {
        queueMicrotask(() => {
            globalState[id][0][index] = value
            reRender()
        })
    }

    return [globalState[id][0][index], setter]
}

export default useState

// renderer will call this when starting any new component
export function setComponent(id: string) {
    hookCount = 0
    componentId = id
}
