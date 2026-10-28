import { type Component, type VNode, type VNodeArrayChildren, Fragment, h } from 'vue';

// vue/jsx-runtime cannot serve: it hands components non-function slot children (a warning each) and throws mounting a
// Fragment whose only child is a string.
function jsx(type: string | Component | typeof Fragment, props: Record<string, unknown>, key?: string): VNode {
    const { children, className, ...rest } = props;
    if (key !== undefined) rest.key = key;
    // className on a component would replace the root class in the DOM and render a second class attribute on the
    // server, so it joins class
    if (className !== undefined) rest.class = rest.class === undefined ? className : [className, rest.class];
    if (type === Fragment) return h(Fragment, rest, (children === undefined ? [] : [children].flat()) as VNodeArrayChildren);
    if (typeof type === 'string' || children === undefined) return h(type as Component, rest, children as never);
    return h(type as Component, rest, { default: () => children });
}

export default { Fragment, jsx, jsxs: jsx, elementAttributeNameCase: 'html' as const };
