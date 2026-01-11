# Tiny React

A minimal React-like library built from scratch in TypeScript, implementing React's core concepts including Fiber architecture, hooks, and concurrent rendering foundations.

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

## Architecture Overview

### Fiber Nodes
Each component/element is represented as a Fiber node with:
- `node`: Virtual DOM node
- `alternate`: Previous Fiber for reconciliation
- `parent`, `child`, `sibling`: Linked list structure
- `phase`: Work state (0=todo, 1=begun, 2=finished)
- `effects`: DOM operations to commit

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

## Roadmap

- [x] Basic rendering
- [x] Virtual DOM reconciliation
- [x] Hooks system
- [x] Multi-root support
- [x] Fiber architecture
- [ ] Time slicing (yielding to browser)
- [ ] Priority-based scheduling
- [ ] Error boundaries
- [ ] Suspense
- [ ] Concurrent features

---

## Learning Resources

This implementation is inspired by:
- React Fiber architecture
- "React in 400 lines" blog posts
- Diract blog series on React internals

Built to understand React's internals through hands-on implementation.