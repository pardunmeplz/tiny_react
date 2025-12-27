import { createElement } from '../react_lib/createElement'
import render from '../react_lib/render'
import useState from '../react_lib/hooks'
import './style.css'

const container = document.querySelector<HTMLDivElement>('#app')!

const counter = (props: any) => {
    const [state, setState] = useState("")
    return createElement("input", {
        onChange: (e: any) => {
            setState(e.target.value.toUpperCase());
            if (props?.updateCount) {
                props.updateCount()
            }
        }, value: state
    }, [])
}

render(createElement(() => {

    const [state, setState] = useState(20)
    // const deps = [state]

    // useEffect(() => {
    // }, deps)
    // deps.pop()

    if (state > 0) return createElement("div", {},
        ["Counter list", createElement(counter, { key: "A", updateCount: () => setState((x: number) => x + 1) }), createElement(counter), createElement(counter, { key: "B", updateCount: () => setState((x: number) => x - 1) }), state])

    return createElement("div", { onClick: () => { setState((x: any) => x - 1) } },
        ["Counter list", createElement(counter, { key: "B" }), createElement(counter), createElement(counter, { key: "A" }), state])
}, {}), container)

