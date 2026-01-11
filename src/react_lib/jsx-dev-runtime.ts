import { createElement } from "./createElement";

export function jsxDEV(
    type: any,
    props: any,
    key: any,
) {
    return createElement(type, { ...props, key });
}
