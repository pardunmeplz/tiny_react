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

    return createElement("div", { onclick: () => { setState(state - 1) } },
        ["Counter list", createElement(counter), state > 0 ? createElement(counter) : "KILLED", createElement(counter)])
}, {}), contianer)
