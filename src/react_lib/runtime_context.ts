import type { hookSlot } from "./hooks";
import type { Root } from "./root";

export var currentRoot: Root
var componentId: string
var hookCount: number

export const setHookSlot = ([componentId, hookIndex]: [string, number], slot: hookSlot) => currentRoot.hookState[componentId][hookIndex] = slot
export const getHookSlot = ([componentId, hookIndex]: [string, number]) => currentRoot.hookState[componentId][hookIndex]
export const setRoot = (root: Root) => {
    currentRoot = root
    componentId = ""
    hookCount = 0
}

export function setComponent(id: string) {
    hookCount = 0
    componentId = id
}

export function newComponentBoundary(id: string) {
    const oldId = componentId
    const oldCount = hookCount
    componentId = id
    hookCount = 0
    return { endBoundary: () => { componentId = oldId; hookCount = oldCount } }
}

export function unmountState(componentId: string) {
    currentRoot.hookState[componentId].forEach(x => {
        if ([1, 2].includes(x?.hook ?? -1) && x?.cleanup) currentRoot.effectQueue.push(() => x?.cleanup?.())
    })
    delete currentRoot.hookState[componentId]
}

export function getHookIndex(x: hookSlot | null): [string, number] {
    if (componentId == null) throw Error("Hooks can only be used inside a component")
    const id = componentId
    const index = hookCount++

    // add missing component entry
    if (!Object.hasOwn(currentRoot.hookState, id)) {
        currentRoot.hookState[id] = []
    }

    // add missing state entry
    if (currentRoot.hookState[id].length <= index) {
        currentRoot.hookState[id].push(x)
    }

    // doesnt cover all cases ofc but a good error that can cover several cases of hook misuse for now
    if (currentRoot.hookState[id][index]?.hook && (x?.hook != currentRoot.hookState[id][index]?.hook)) throw Error("Hooks can not be called conditionally")

    return [id, index]
}
