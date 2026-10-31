export function createStore<T extends object>(initial: T) {
    const store = $state(initial);
    return store;
}
