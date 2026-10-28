import { type Accessor, batch, createEffect, createSignal, onCleanup, onMount, untrack } from 'solid-js';
import type { DefaultAdapter, HostContext } from '@fibrae/semi-foundation/base/foundation';

interface Lifecycle {
    connect: () => void;
    disconnect: () => void;
    init?: () => void;
    destroy?: () => void;
}

/** A signal without a value: `notify()` re-runs every `track()` reader, always */
function createTrigger() {
    const [track, notify] = createSignal(undefined, { equals: false });
    return { track, notify: () => notify() };
}

/**
 * The foundation's state: a plain object the adapter reads and writes synchronously, plus one trigger per key.
 * `view.x` subscribes to key `x` only; `write` notifies every written key, even with an equal value, because React and
 * Vue re-render on every `setState` and a foundation may write back a Set it mutated in place. That is also why this
 * is not a `createStore`: a store skips an equal write and does not wrap a Set.
 */
function createStateMirror<S extends object>(initial: S) {
    // replaced on every write, never mutated: an object the foundation got from getStates() keeps its values
    let state = initial;
    // Created on first read, so a key the initial state lacks still subscribes: Modal reads onOKReturnPromiseStatus,
    // which its foundation writes only once onOk returns a promise
    const triggers = new Map<string, ReturnType<typeof createTrigger>>();
    const read = (key: string) => {
        let trigger = triggers.get(key);
        if (!trigger) {
            trigger = createTrigger();
            triggers.set(key, trigger);
        }
        trigger.track();
        return state[key as keyof S];
    };
    // Enumerable, so spreading and the server build's mergeProps, which copies descriptors, see the current keys;
    // listing keys subscribes to nothing, reading a value subscribes to its key
    const view = new Proxy({} as Readonly<S>, {
        get: (_, key) => (typeof key === 'symbol' ? undefined : read(key)),
        has: (_, key) => typeof key === 'string' && Object.hasOwn(state, key),
        ownKeys: () => Object.keys(state),
        getOwnPropertyDescriptor: (_, key) => (typeof key === 'string' && Object.hasOwn(state, key) ? { configurable: true, enumerable: true, get: () => read(key) } : undefined),
        // State changes only through setState; false makes an assignment throw in strict-mode code. A property
        // defined on the empty target would also break `get`, which must then report that property's value
        set: () => false,
        defineProperty: () => false,
    });
    return {
        view,
        current: () => state,
        write: <K extends keyof S>(partial: Pick<S, K>) => {
            state = { ...state, ...partial };
            for (const key of Object.keys(partial)) {
                triggers.get(key)?.notify();
            }
        },
    };
}

/**
 * Runs `setState` callbacks in an effect this hook owns, so after the DOM shows the update. Solid 1 runs the effects of
 * one flush in the order they were notified, so a commit notifies before the state keys do for the callbacks to run
 * ahead of the component's own effects.
 */
function createCommitQueue() {
    let callbacks: (() => void)[] = [];
    const committed = createTrigger();
    // Not deferred: the first run drains callbacks queued before it, by a parent's onMount calling into the foundation
    createEffect(() => {
        committed.track();
        // a callback that calls setState queues for the next commit, not this one
        const pending = callbacks;
        callbacks = [];
        untrack(() => {
            for (const callback of pending) {
                callback();
            }
        });
    });
    onCleanup(() => {
        callbacks = [];
    });
    return (callback?: () => void) => {
        if (callback) {
            callbacks.push(callback);
        }
        committed.notify();
    };
}

/**
 * Hosts a semi-foundation class in a Solid component (host contract: `semi-foundation/src/base/foundation.ts`).
 *
 * - `state().x` subscribes to key `x` only; `state()` itself subscribes to nothing. Spreading, `Object.keys` and `in`
 *   see the current keys; spreading reads, and so subscribes to, every key.
 * - Every written key notifies, equal value or not; a reader that must run once per real change goes through
 *   `createMemo`.
 * - One `setState` is one `batch`: an expression that reads several of its keys runs once, also for a write from a
 *   foundation timer.
 * - Each foundation method call runs in `batch`, as Solid 1 runs delegated event handlers outside it: a handler that
 *   calls the foundation commits once, after it returns, as in React and Vue.
 * - A `setState` callback runs after the DOM shows the update, before the component's effects for it.
 * - `connect` and `init` run in `onMount`, once the DOM is in place; `destroy` and `disconnect` run on disposal, while
 *   the DOM is still in place, and only after a mount.
 * - Props reach the foundation as the live Solid props object, so `getProp` reads the current value; a reaction to a
 *   prop change is the component's own `useWatch`.
 */
export default function useFoundation<F extends Lifecycle, A extends DefaultAdapter<P, S, any>, P extends object, S extends object, C = HostContext<A>>(
    Foundation: new (adapter: A) => F,
    props: P,
    initialState: (props: P) => S,
    createAdapter: (base: DefaultAdapter<P, S, C>) => Omit<A, keyof DefaultAdapter<P, S>>,
    options: { context?: () => C } = {}
): { foundation: F; state: Accessor<Readonly<S>> } {
    const mirror = createStateMirror(initialState(props));
    const commit = createCommitQueue();

    const base: DefaultAdapter<P, S, C> = {
        getContext: (key) => (options.context?.() as C)?.[key] as C[typeof key],
        getContexts: () => options.context?.() as C,
        getProp: (key) => props[key],
        getProps: () => props,
        getState: (key) => mirror.current()[key],
        getStates: () => mirror.current(),
        setState: (partial, callback) => {
            batch(() => {
                commit(callback);
                mirror.write(partial);
            });
        },
    };

    const instance = new Foundation({ ...base, ...createAdapter(base) } as A);
    // one wrapper per method name: a handler passed by reference stays removable with removeEventListener
    const methods = new Map<PropertyKey, unknown>();
    const foundation = new Proxy(instance, {
        get(target, key) {
            // read and called on the instance itself, so its native private fields stay reachable
            const value: unknown = Reflect.get(target, key, target);
            if (typeof value !== 'function') {
                return value;
            }
            if (!methods.has(key)) {
                methods.set(key, (...args: unknown[]) => batch(() => (value as (...params: unknown[]) => unknown).apply(target, args)));
            }
            return methods.get(key);
        },
    });

    onMount(() => {
        foundation.connect();
        foundation.init?.();
        // Registered here, not at the top level: a server render disposes without mounting, and destroy touches the DOM
        onCleanup(() => {
            foundation.destroy?.();
            foundation.disconnect();
        });
    });

    return { foundation, state: () => mirror.view };
}
