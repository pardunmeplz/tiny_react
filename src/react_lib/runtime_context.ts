import type { fiberNode } from "./fiber";
import type { hookSlot } from "./hooks";
import type { Root } from "./root";

export var currentRoot: Root

export const setRoot = (root: Root) => {
    currentRoot = root
    currentRoot.currentFiber = undefined
    currentRoot.hookCount = 0
}

export function setCurrentFiber(fiber: fiberNode) {
    currentRoot.hookCount = 0
    currentRoot.currentFiber = fiber
}

export interface componentBoundaryContext {
    endBoundary: Function
}

export function newComponentBoundary(fiber: fiberNode): componentBoundaryContext {
    const oldFiber = currentRoot.currentFiber
    const oldCount = currentRoot.hookCount
    currentRoot.currentFiber = fiber
    currentRoot.hookCount = 0
    return { endBoundary: () => { currentRoot.currentFiber = oldFiber; currentRoot.hookCount = oldCount } }
}

export function getHookState(x: hookSlot | undefined): [() => hookSlot | undefined, Function] {
    const fiber = currentRoot.currentFiber
    const index = currentRoot.hookCount++
    if (!fiber) throw Error("Hooks can only be used inside a component")

    // transfer hook state from previous fiber
    if (!currentRoot.hookState.has(fiber) && fiber.alternate && currentRoot.hookState.has(fiber.alternate)) {
        currentRoot.hookState.set(fiber, [...currentRoot.hookState.get(fiber.alternate)!])
    } else if (!currentRoot.hookState.has(fiber)) {
        currentRoot.hookState.set(fiber, [])
    }

    // push data if doesnt exist
    if (index >= currentRoot.hookState.get(fiber)?.length!) {
        currentRoot.hookState.get(fiber)?.push(x)
    }

    // doesnt cover all cases ofc but a good error that can cover several cases of hook misuse for now
    if (currentRoot.hookState.get(fiber)?.[index]?.hook && (x?.hook != currentRoot.hookState.get(fiber)?.[index]?.hook)) throw Error("Hooks can not be called conditionally")

    // return get and set for slot
    return [() => currentRoot.hookState.get(fiber)?.[index], (slot: hookSlot) => { currentRoot.hookState.get(fiber)![index] = slot }]
}
