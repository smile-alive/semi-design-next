// The Foundation / Adapter split is modeled on Material Components for Web:
// https://github.com/material-components/material-components-web

/**
 * C is the context the host provides to the foundation: the keys it reads and their types. A foundation that reads
 * context declares it in its own adapter, which is the contract a host assembles the context against.
 */
export interface DefaultAdapter<P = Record<string, any>, S = Record<string, any>, C = unknown> {
    getContext<K extends keyof C>(key: K): C[K];
    getContexts(): C;
    getProp<K extends keyof P>(key: K): P[K];
    getProps(): P;
    getState<K extends keyof S>(key: K): S[K];
    getStates(): S;
    /**
     * Merges `s` into the state synchronously, so the next `getState(s)` already reads it, and always re-renders.
     * `callback` runs once that re-render is committed.
     */
    setState<K extends keyof S>(s: Pick<S, K>, callback?: () => void): void;
}

/** The context type an adapter declares; `unknown` for a foundation that does not read context */
export type ContextOf<T> = T extends DefaultAdapter<any, any, infer C> ? C : never;

// shortcut: a foundation that declares no context (unknown) reads it untyped; drop the any once every foundation declares its context.
// The keyof check tells an undeclared context from a declared one: `unknown extends X` also holds for weak and nullable declared types when strictNullChecks is off.
export type HostContext<A> = unknown extends ContextOf<A> ? ([keyof ContextOf<A>] extends [never] ? any : ContextOf<A>) : ContextOf<A>;

/** The context of a foundation that only reads the reading direction from the enclosing ConfigProvider */
export interface DirectionContext {
    direction?: 'ltr' | 'rtl';
}

/**
 * Framework-free component logic; the framework host implements the adapter and drives the lifecycle.
 *
 * Host contract, implemented by the React and Vue `_base/use-foundation` hosts; `vitest/utils/host-contract.ts` is
 * its framework-free test fixture, which every host's driver runs:
 * - The constructor may run more than once per mount (StrictMode discards one instance), so it has no side effects.
 * - On mount the host calls `connect()` then `init()`, after the DOM is in place and before paint (layout phase).
 *   On unmount it calls `destroy()` then `disconnect()`. Under StrictMode the kept instance goes through
 *   init -> destroy -> init. `destroy()` must not rely on the DOM still being attached: Svelte removes a
 *   component's DOM before it runs teardown.
 * - `init()` may run again after `destroy()` on state the user already changed (StrictMode, and React Activity each
 *   time it shows again), so it must be idempotent: initial values resolved from props (`default*`, `value`) belong
 *   in a static `getInitialState` the host calls when it creates the state; `init()` only subscribes and runs
 *   guarded one-time side effects.
 * - `getProps`, `getStates` and `getContext` read the latest values: the host syncs props and context before any
 *   layout effect of the commit runs, and state as soon as `setState` is called. Only their content is contract:
 *   whether render state is the `getStates()` object and which extra keys `getProps()` carries differ by host.
 * - A `setState` callback runs after the commit that shows the new state, before the layout effects the component
 *   declares after the host.
 * - Foundation instance methods run from events and effects, never during render. A reaction to a prop change runs
 *   in the layout phase of the commit in which the value changed, never on mount
 *   (`semi-ui-react/_base/use-did-update`).
 * - Vue uses onMounted/onBeforeUnmount for the lifecycle, shallowRef replacement for synchronous state, and a
 *   post-flush watcher for commit callbacks. KeepAlive deactivation calls neither destroy nor init; a component that
 *   must release listeners while cached uses `semi-ui-vue/_base/use-keep-alive-foundation`. The instance stays
 *   markRaw so native private fields remain accessible.
 * - Vue maps modelValue to value/checked and resolves runtime defaults through the adapter's props overlay;
 *   initial state, getProp and getProps all read that same view. Notifications leave through adapter methods.
 */
export default class BaseFoundation<T extends DefaultAdapter<P, S, any>, P = Record<string, any>, S = Record<string, any>> {
    #lifetime: AbortController | null = null;
    protected adapter: T;

    constructor(adapter: T) {
        this.adapter = adapter;
    }

    /**
     * A prop is controlled when its value is not `undefined`: a Vue adapter's props hold every declared key. Without
     * a key it checks `value`, the controlled prop of most components.
     */
    protected isControlledComponent(key: keyof P & string = 'value' as keyof P & string) {
        return this.getProps()[key] !== undefined;
    }

    /** Aborted when the component unmounts: a listener registered with it needs no removal of its own */
    protected get signal() {
        // a listener added before mount or after unmount would never be removed
        if (!this.#lifetime) {
            throw new Error('[Semi] foundation.signal is only available while the component is mounted');
        }
        return this.#lifetime.signal;
    }

    getProp<K extends keyof P>(key: K) {
        return this.adapter.getProp(key);
    }

    getProps() {
        return this.adapter.getProps();
    }

    getState<K extends keyof S>(key: K) {
        return this.adapter.getState(key);
    }

    getStates() {
        return this.adapter.getStates();
    }

    setState<K extends keyof S>(states: Pick<S, K>, cb?: () => void) {
        return this.adapter.setState({ ...states }, cb);
    }

    getContext<K extends keyof ContextOf<T>>(key: K): ContextOf<T>[K] {
        return this.adapter.getContext(key);
    }

    getContexts() {
        return this.adapter.getContexts() as ContextOf<T>;
    }

    // connect and disconnect belong to the framework host, which calls them around init and destroy, so a subclass
    // overriding init or destroy cannot forget them
    connect() {
        this.#lifetime = new AbortController();
    }

    disconnect() {
        this.#lifetime?.abort();
        this.#lifetime = null;
    }

    init() {
        // Subclasses override this to register what lives for the mount (listeners, observers)
    }

    destroy() {
        // Subclasses override this to undo what init registered
    }
}
