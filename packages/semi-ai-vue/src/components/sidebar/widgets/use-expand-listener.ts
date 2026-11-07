import { getCurrentInstance } from 'vue';

// defineEmits cannot tell whether a parent bound @expand, so the vnode props are read (`onExpand`, and
// `onExpandOnce` for `.once`). Read at render time: the vnode is replaced whenever the parent re-renders.
export function useHasExpandListener() {
    const instance = getCurrentInstance();

    return () => {
        const vnodeProps = instance?.vnode.props;
        return Boolean(vnodeProps?.onExpand || vnodeProps?.onExpandOnce);
    };
}
