import { createElement } from '../react_lib/createElement'
import { useState } from '../react_lib/hooks'
import createRoot from '../react_lib/root'
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

createRoot(container).render(createElement(() => {

    const [state, setState] = useState(20)

    if (state > 0) return createElement("div", {},
        ["Counter list", createElement(counter, { key: "A", updateCount: () => setState((x: number) => x + 1) }), createElement(counter), createElement(counter, { key: "B", updateCount: () => setState((x: number) => x - 1) }), state])

    return createElement("div", { onClick: () => { setState((x: any) => x - 1) } },
        ["Counter list", createElement(counter, { key: "B" }), createElement(counter), createElement(counter, { key: "A" }), state])
}, {}))

