import { type Component, type VNodeChild, defineComponent } from 'vue';

/**
 * The Holder of a hook API (useToast, useNotification, useModal): a component whose render function closes over that
 * call's store or list. Provide/inject would give two calls in one component only the later one.
 */
export function createHolder(name: string, render: () => VNodeChild): Component {
    return defineComponent({ name, setup: () => render });
}
