import { type Accessor, For, type JSX, createMemo } from 'solid-js';

interface ByKeyProps<T> {
    each: readonly T[];
    by: (item: T, index: number) => string | number;
    children: (item: Accessor<T>) => JSX.Element;
}

/**
 * `For` keyed by a value of the item instead of its identity: the layout code returns new objects on every update, and an
 * event whose key survives must keep its DOM node and follow the new data.
 */
export default function ByKey<T>(props: ByKeyProps<T>) {
    const items = createMemo(() => new Map(props.each.map((item, index) => [props.by(item, index), item] as const)));
    const keys = createMemo(() => [...items().keys()]);

    // the item of a removed key can still be read once while its node is being disposed
    const itemOf = (key: string | number) => {
        let last = items().get(key) as T;
        return createMemo(() => (last = items().get(key) ?? last));
    };

    return <For each={keys()}>{(key) => props.children(itemOf(key))}</For>;
}
