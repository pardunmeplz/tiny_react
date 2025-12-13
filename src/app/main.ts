import { createElement } from '../react_lib/createElement'
import render from '../react_lib/render'
import useState from '../react_lib/useState'
import './style.css'

const contianer = document.querySelector<HTMLDivElement>('#app')!

const counter = () => {
    const [state, setState] = useState("")
    return createElement("input", { onChange: (e: any) => { setState(e.target.value.toUpperCase()) }, value: state }, [])
}

render(createElement(() => {
    return createElement("div", {},
        ["Counter list", createElement(counter, { key: "A" }), createElement(counter), createElement(counter, { key: "B" })])

    // return createElement("div", { onClick: () => { setState((x: any) => x - 1) } },
    //     ["Counter list", createElement(counter, { key: "B" }), createElement(counter), createElement(counter, { key: "A" })])
}, {}), contianer)

// const test = () => {
//     const [state, _] = useState(55)
//     return createElement("div", {}, [state])
// }
