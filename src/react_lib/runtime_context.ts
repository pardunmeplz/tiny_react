import type { hookSlot } from "./hooks";
import type { Root } from "./root";

export var currentRoot: Root

export const setHookSlot = ([componentId, hookIndex]: [string, number], slot: hookSlot) => currentRoot.hookState[componentId][hookIndex] = slot
export const getHookSlot = ([componentId, hookIndex]: [string, number]) => currentRoot.hookState[componentId][hookIndex]
export const setRoot = (root: Root) => {
    currentRoot = root
    currentRoot.componentId = ""
    currentRoot.hookCount = 0
}

export function setComponent(id: string) {
    currentRoot.hookCount = 0
    currentRoot.componentId = id
}

export interface componentBoundaryContext {
    endBoundary: Function
}

export function newComponentBoundary(id: string): componentBoundaryContext {
    const oldId = currentRoot.componentId
    const oldCount = currentRoot.hookCount
    currentRoot.componentId = id
    currentRoot.hookCount = 0
    return { endBoundary: () => { currentRoot.componentId = oldId; currentRoot.hookCount = oldCount } }
}

export function unmountState(componentId: string) {
    currentRoot.hookState[componentId].forEach(x => {
        if ([1, 2].includes(x?.hook ?? -1) && x?.cleanup) currentRoot.effectQueue.push(() => x?.cleanup?.())
    })
    delete currentRoot.hookState[componentId]
}

export function getHookIndex(x: hookSlot | null): [string, number] {
    if (currentRoot.componentId == null) throw Error("Hooks can only be used inside a component")
    const id = currentRoot.componentId
    const index = currentRoot.hookCount++

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
