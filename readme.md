# Tiny React

A minimal React-like library built from scratch in TypeScript, implementing React's core concepts including Fiber architecture, hooks, and concurrent rendering foundations with basic time-slicing.

The project is a study to understand React's inner workings, building incrementally from basic rendering to Fiber-based concurrent mode.

---

## Features

### Core Rendering
- Functional components with JSX-like API (`createElement`)
- Virtual DOM with reconciliation
- Multi-root support (multiple independent React trees)
- Key-based child reconciliation

### Hooks System
- `useState` - State management with stable state across renders
- `useEffect` - Side effects with dependency tracking
- `useLayoutEffect` - Synchronous effects after DOM mutations
- Hook state stored per Fiber node (WeakMap-based)
- Proper hook state transfer during reconciliation

### Fiber Architecture
- Linked list Fiber tree structure (parent → child → sibling)
- Two-phase work: `beginWork` (render) and `completeWork` (commit prep)
- Work loop pattern ready for time slicing
- Alternate tree for reconciliation
- Effect collection and bubbling

### Rendering Pipeline
- Render phase: Pure component evaluation
- Reconciliation phase: Diffing with Fiber traversal
- Commit phase: Batched DOM mutations
- Effect phase: Run effects after commit

---

### Fiber Node Model
The architecture aims to implement cursor based traversal over the component tree rather than using recursion in order to have more flexible control flow enabling concurrent mode behaviors.
Each Fiber represents a unit of work and contains:
- `node`: Virtual DOM node
- `alternate`: Previous Fiber (for reconciliation)
- `parent`, `child`, `sibling`: Linked list structure
- `phase`: Work state (0=todo, 1=begun, 2=finished)
- `commits`: DOM operations to commit
- `effects`: scheduled effects to run post commit

### Work Loop
The work loop traverses the Fiber tree depth-first:
1. **beginWork**: Evaluate component, diff, create child fibers
2. **completeWork**: Collect effects, handle reordering
3. Traverse: child → sibling → parent (when complete)

### Hook State
Hooks are stored in a WeakMap keyed by Fiber node:
- State persists across renders via alternate Fiber
- Hook order tracked per component
- Cleanup on unmount

---

## File map (high level)
- `src/react_lib/createElement.ts` — vnode factory
- `src/react_lib/jsx-dev-runtime.ts` — JSX runtime entry
- `src/react_lib/fiber.ts` — fiber shape, begin/complete work, child fiber creation
- `src/react_lib/render.ts` — evaluate components, per-fiber diff, end reconciliation
- `src/react_lib/commits.ts` — DOM commit operations
- `src/react_lib/updateProperties.ts` — prop/listener/attr diff helpers
- `src/react_lib/hooks.ts` — `useState`, `useEffect`, `useLayoutEffect`
- `src/react_lib/runtime_context.ts` — current root/fiber + hook bookkeeping
- `src/react_lib/scheduling.ts` — time-sliced work loop + scheduling
- `src/app/main.tsx` — demo app

---

## Known Limitations / Future Work
This project intentionally stops short of full React parity.
Possible extensions:

- Priority lanes & update types
- Suspense / async rendering
- Error boundaries
- Improved testing harness
- Dev-only diagnostics & warnings
- Better DX for hook misuse detection

---

## Learning Resources

This implementation is inspired by:
- React Fiber architecture
- Diract blog series on React internals

Built to understand React's internals through hands-on implementation.