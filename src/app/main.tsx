import { createElement } from '../react_lib/createElement'
import { useEffect, useState } from '../react_lib/hooks'
import createRoot from '../react_lib/root'
import './style.css'

const container = document.querySelector<HTMLDivElement>('#app')!

const Counter = (props: any) => {
    const [state, setState] = useState("")
    return createElement("input", {
        onChange: (e: any) => {
            setState(e.target.value.toUpperCase());
            if (props?.updateCount) {
                props.updateCount()
            }
        }, value: state
    })
}


const App = () => {

    const [state, setState] = useState(20)

    useEffect(() => {
        if (state == 50) alert(state)
    }, [state])

    if (state > 0) return <div>
        Counter list
        < Counter key={"A"} updateCount={() => setState((x: number) => x + 1)} />
        < Counter />
        < Counter key={"B"} updateCount={() => setState((x: number) => x - 1)} />
        {state}
    </div>

    return <div>
        Counter list
        < Counter key={"B"} updateCount={() => setState((x: number) => x - 1)} />
        < Counter key={"A"} updateCount={() => setState((x: number) => x + 1)} />
        {state}
    </div>

}

createRoot(container).render(<App />)
