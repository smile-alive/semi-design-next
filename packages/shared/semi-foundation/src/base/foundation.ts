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

export interface DirectionContext {
    direction?: 'ltr' | 'rtl';
}

/** What a framework host calls on a foundation instance; every `BaseFoundation` satisfies it */
export interface Lifecycle {
    connect(): void;
    disconnect(): void;
    init(): void;
    destroy(): void;
    handlePropsChange(prev: Record<string, unknown>): void;
}

/** The statics a host reads off a foundation class; `BaseFoundation` declares both */
export interface PropReactions {
    readonly propKeys: readonly string[];
    readonly propEquals: Readonly<Record<string, (a: any, b: any) => boolean>>;
}

/**
 * The host side of `handlePropsChange`: `check()` reads every key of `propKeys` through `read`, so a host that calls it
 * inside its reactive effect subscribes to them, and returns the previous snapshot when one of them changed since the
 * last `check()` (or since creation, so a mount never reports a change).
 */
export function createPropsTracker({ propKeys, propEquals }: PropReactions, read: (key: string) => unknown) {
    const snapshot = () => Object.fromEntries(propKeys.map((key) => [key, read(key)]));
    let committed = snapshot();
    return {
        check(): Record<string, unknown> | undefined {
            const next = snapshot();
            const prev = committed;
            if (propKeys.every((key) => (propEquals[key] ?? Object.is)(prev[key], next[key]))) {
                return undefined;
            }
            committed = next;
            return prev;
        },
    };
}

/**
 * Framework-free component logic; the framework host implements the adapter and drives the lifecycle.
 *
 * Host contract, which every framework's `_base/use-foundation` implements and maps onto its own primitives in its
 * header comment; `vitest/utils/host-contract.ts` is its framework-free test fixture, which every host's driver runs:
 * - The constructor may run more than once per mount (a host may discard an instance), so it has no side effects.
 * - On mount the host calls `connect()` then `init()`, after the DOM is in place and before paint. On unmount it calls
 *   `destroy()` then `disconnect()`. `destroy()` must not rely on the DOM still being attached: a host may remove it
 *   before teardown.
 * - Hiding a component without unmounting it (React StrictMode's replay, React Activity, a Vue component that opts in
 *   through `useKeepAliveFoundation`) is `destroy()`, and showing it again is `init()`, on the state the user already
 *   changed. `destroy()` undoes everything `init()` set up (listeners, timers, page-level holds) and writes no state:
 *   an open panel stays open, hidden with the subtree (React Activity hides portals, Vue's Portal and Tooltip move
 *   theirs into the cached subtree), so a setup -> cleanup -> setup replay is indistinguishable from one setup;
 *   `init()` is idempotent and re-arms what an open panel needs. Initial values resolved from props
 *   (`default*`, `value`) belong in a static `getInitialState` the host calls when it creates the state; one-time side
 *   effects (autofocus, `defaultOpen`) belong in `initOnce()`.
 * - `getProp`, `getProps`, `getStates` and `getContext` read the current values: the host syncs props and context
 *   before any layout effect of the commit runs, and state as soon as `setState` is called. Only their content is
 *   contract, never object identity: whether `getProps()` returns a new object and which extra keys it carries differ
 *   by host.
 * - A `setState` callback runs after the commit that shows the new state, before the layout effects the component
 *   declares after the host.
 * - Foundation instance methods run from events and effects, never during render.
 * - A reaction to a prop change is `handlePropsChange(prev)`: after a commit in which any key of the static
 *   `propKeys` changed (`propEquals[key]`, `Object.is` otherwise), the host calls it once with the previous values of
 *   all those keys, after the commit's `setState` callbacks; never on mount.
 * - Notifications leave through adapter methods.
 */
export default class BaseFoundation<T extends DefaultAdapter<P, S, any>, P = Record<string, any>, S = Record<string, any>> implements Lifecycle {
    #lifetime: AbortController | null = null;
    #started = false;
    protected adapter: T;
    /** The props `handlePropsChange` reacts to */
    static readonly propKeys: readonly string[] = [];
    /** A comparison for a key of `propKeys` whose change is not an `Object.is` change */
    static readonly propEquals: Readonly<Record<string, (a: any, b: any) => boolean>> = {};

    constructor(adapter: T) {
        this.adapter = adapter;
    }

    /**
     * A prop is controlled when its value is not `undefined`, since a host may hold every declared key. Without a key
     * it checks `value`, the controlled prop of most components.
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

    /** `setState` whose Promise resolves once the commit showing it ran, after a controlled parent wrote its value back */
    protected commitState<K extends keyof S>(states: Pick<S, K>) {
        return new Promise<void>((resolve) => this.setState(states, resolve));
    }

    /** Runs once per instance, right before its first `init()`; `signal` is already available */
    protected initOnce() {
        // Subclasses override this for one-time side effects (autofocus, defaultOpen)
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
        if (!this.#started) {
            this.#started = true;
            this.initOnce();
        }
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

    /** `prev` holds the previous value of every key of the static `propKeys`; `getProp` reads the current ones */
    handlePropsChange(_prev: Partial<P>) {
        // Subclasses override this to react to a change of their propKeys
    }
}
