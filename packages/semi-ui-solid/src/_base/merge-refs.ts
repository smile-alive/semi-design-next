/**
 * One ref callback for several targets. A consumer's `ref` reaches a component as a function (the compiler rewrites
 * `ref={variable}` to an assignment), so the component's own ref and the consumer's both receive the element.
 */
export default function mergeRefs<T>(...refs: (((element: T) => void) | T | undefined)[]) {
    return (element: T) => {
        for (const ref of refs) {
            if (typeof ref === 'function') {
                (ref as (element: T) => void)(element);
            }
        }
    };
}
