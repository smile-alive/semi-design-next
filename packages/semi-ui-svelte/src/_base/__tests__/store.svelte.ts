/** A deeply reactive object a test writes to drive a component's props */
export function createStore<T extends object>(initial: T) {
    const store = $state(initial);
    return store;
}
