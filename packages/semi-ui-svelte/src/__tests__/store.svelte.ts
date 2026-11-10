export function createStore<T extends object>(initial: T) {
    const store = $state(initial);
    return store;
}

/** A plain deep copy of a `$state` proxy, which `structuredClone` rejects */
export function snapshot<T>(value: T) {
    return $state.snapshot(value) as T;
}
