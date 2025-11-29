import { createTextNode } from '../react_lib'
import render from '../react_lib/render'
import './style.css'

const contianer = document.querySelector<HTMLDivElement>('#app')!

render({
    type: "div",
    props: {},
    children: [createTextNode("test value")]
}, contianer)

