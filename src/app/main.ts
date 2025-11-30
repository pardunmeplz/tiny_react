import render from '../react_lib/render'
import useState from '../react_lib/useState'
import './style.css'

const contianer = document.querySelector<HTMLDivElement>('#app')!

const counter = () => {
    const [state, setState] = useState(0)
    return {
        type: "div",
        props: { onClick: () => { setState(state + 1); } },
        children: ["Count ", state]
    }
}

render(() => {
    return {
        type: "div",
        props: {},
        children: ["Counter list", counter, counter, counter]
    }
}, contianer)

