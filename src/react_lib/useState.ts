import { reRender } from "./render";

const globalState: Record<string, any> = {}
var hookCount = 0
export var componentId: number | null = null

function useState(x: any): [any, (value: any) => void] {
    hookCount++
    const key = `${hookCount}${componentId}`;
    if (!Object.hasOwn(globalState, key)) {
        globalState[key] = x
    }

    const setter = (value: any) => {
        queueMicrotask(() => {
            globalState[key] = value
            reRender()
        })
    }

    return [globalState[key], setter]

}

export default useState

// renderer will call this when starting any new component
export function setComponent(id: number) {
    hookCount = 0
    componentId = id
}
