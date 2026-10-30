import { onMount, untrack } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import type { DefaultAdapter, HostContext } from '@fibrae/semi-foundation/base/foundation';

interface Lifecycle {
    connect: () => void;
    disconnect: () => void;
    init?: () => void;
    destroy?: () => void;
}

/** A counter readers subscribe to; `bump` re-runs them even when the written value is equal */
class Version {
    value = $state(0);
    bump() {
        this.value += 1;
    }
}

/**
 * The foundation's state: a plain object the adapter reads and writes synchronously, plus one version per key, so a
 * reader of `view.x` re-runs only for writes to `x`. Every write notifies, equal value or not, because React and Vue
 * re-render on every `setState` and a foundation may write back a Set it mutated in place; a `$state` proxy would
 * skip an equal write and wrap the Set.
 */
function createStateMirror<S extends object>(initial: S) {
    // replaced on every write, never mutated: an object the foundation got from getStates() keeps its values
    let state = initial;
    // Not a lazily created $state per key: Svelte does not track a signal read by the reaction that created it, so the
    // first template effect to read a key would never re-run. SvelteMap tracks a missing key from any reader
    const versions = new SvelteMap<string, number>();
    const view = new Proxy({} as Readonly<S>, {
        get: (_, key) => {
            if (typeof key === 'symbol') {
                return undefined;
            }
            versions.get(key);
            return state[key as keyof S];
        },
        has: (_, key) => typeof key === 'string' && Object.hasOwn(state, key),
        ownKeys: () => Object.keys(state),
        getOwnPropertyDescriptor: (_, key) => (typeof key === 'string' && Object.hasOwn(state, key) ? { configurable: true, enumerable: true, get: () => view[key as keyof S] } : undefined),
        set: () => false,
        defineProperty: () => false,
    });
    return {
        view,
        current: () => state,
        write: (partial: Partial<S>) => {
            state = { ...state, ...partial };
            untrack(() => {
                for (const key of Object.keys(partial)) {
                    versions.set(key, (versions.get(key) ?? 0) + 1);
                }
            });
        },
    };
}

/**
 * Hosts a semi-foundation class in a Svelte component (host contract: `semi-foundation/src/base/foundation.ts`).
 *
 * - `states().x` subscribes to key `x` only; every `setState` notifies its keys, equal value or not. The name is not
 *   `state` because a local `state` turns the `$state` rune of the same component into a store subscription.
 * - Svelte batches synchronous writes and flushes them in a microtask, so one handler commits once.
 * - A `setState` callback runs in an effect this hook creates, so after the DOM shows the update and before the
 *   effects the component creates after the host: Svelte runs one component's effects in creation order.
 * - Foundation methods run untracked: a method called from an effect does not subscribe that effect to the props and
 *   state the method reads.
 * - `connect` and `init` run in `onMount`; `destroy` and `disconnect` run in its teardown, which Svelte runs after
 *   it removed the component's DOM. Svelte has no hook before that removal.
 */
export default function useFoundation<F extends Lifecycle, A extends DefaultAdapter<P, S, any>, P extends object, S extends object, C = HostContext<A>>(
    Foundation: new (adapter: A) => F,
    props: P,
    initialState: (props: P) => S,
    createAdapter: (base: DefaultAdapter<P, S, C>) => Omit<A, keyof DefaultAdapter<P, S>>,
    options: { context?: () => C } = {}
) {
    let callbacks: (() => void)[] = [];
    const committed = new Version();

    // one wrapper per method name: a handler passed by reference stays removable with removeEventListener
    const methods = new Map<PropertyKey, unknown>();

    const mirror = createStateMirror(untrack(() => initialState(props)));

    const base: DefaultAdapter<P, S, C> = {
        getContext: (key) => (options.context?.() as C)?.[key] as C[typeof key],
        getContexts: () => options.context?.() as C,
        getProp: (key) => props[key],
        getProps: () => props,
        getState: (key) => mirror.current()[key],
        getStates: () => mirror.current(),
        setState: (partial, callback) => {
            if (callback) {
                callbacks.push(callback);
            }
            committed.bump();
            mirror.write(partial as Partial<S>);
        },
    };

    const instance = new Foundation({ ...base, ...createAdapter(base) } as A);

    const foundation = new Proxy(instance, {
        get(target, key) {
            const value: unknown = Reflect.get(target, key, target);
            if (typeof value !== 'function') {
                return value;
            }
            if (!methods.has(key)) {
                methods.set(key, (...args: unknown[]) => untrack(() => (value as (...params: unknown[]) => unknown).apply(target, args)));
            }
            return methods.get(key);
        },
    });

    $effect(() => {
        void committed.value;
        // a callback that calls setState queues for the next commit, not this one
        const pending = callbacks;
        callbacks = [];
        untrack(() => {
            for (const callback of pending) {
                callback();
            }
        });
    });

    onMount(() => {
        foundation.connect();
        foundation.init?.();
        return () => {
            foundation.destroy?.();
            foundation.disconnect();
        };
    });

    return { foundation, states: () => mirror.view };
}
