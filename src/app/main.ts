import { createElement } from '../react_lib/createElement'
import render from '../react_lib/render'
import useState from '../react_lib/useState'
import './style.css'

const contianer = document.querySelector<HTMLDivElement>('#app')!

const counter = () => {
    const [state, setState] = useState(0)
    return createElement("div", { onClick: () => { setState(state + 1) } }, ["Count ", state])
}

render(createElement(() => {

    const [state, setState] = useState(20)

    if (state > 0) return createElement("div", { onclick: () => { setState((x: any) => x - 1) } },
        ["Counter list", createElement(counter, { key: "A" }), createElement(counter), createElement(counter, { key: "B" })])

    return createElement("div", { onclick: () => { setState((x: any) => x - 1) } },
        ["Counter list", createElement(counter, { key: "B" }), createElement(counter), createElement(counter, { key: "A" })])
}, {}), contianer)

// const test = () => {
//     const [state, _] = useState(55)
//     return createElement("div", {}, [state])
// }
