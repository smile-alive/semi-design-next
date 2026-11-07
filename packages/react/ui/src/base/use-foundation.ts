import { useInsertionEffect, useLayoutEffect, useState } from 'react';
import { type DefaultAdapter, type HostContext, type Lifecycle, type PropReactions, createPropsTracker } from '@fibrae/semi-foundation/base/foundation';

// A plain object rather than refs: render reads only the stable `foundation`, satisfying the Compiler `refs` rule.
class FoundationHost<F extends Lifecycle, A extends DefaultAdapter<P, S, any>, P, S extends object, C> {
    readonly #callbacks = new Map<number, () => void>();
    // An urgent commit can skip a pending transition's update, so a callback waits for a state built by its own updater
    readonly #applied = new WeakMap<S, number[]>();
    #nextId = 0;
    readonly #render: (update: (prev: S) => S) => void;
    readonly #propsTracker: ReturnType<typeof createPropsTracker>;
    #props: P;
    #context: C;
    // written only by the constructor and setState; render state is a copy and never flows back
    #state: S;
    readonly foundation: F;

    constructor(Foundation: (new (adapter: A) => F) & PropReactions, createAdapter: (base: DefaultAdapter<P, S, C>) => Omit<A, keyof DefaultAdapter<P, S>>, props: P, state: S, context: C, render: (update: (prev: S) => S) => void) {
        this.#props = props;
        this.#state = state;
        this.#context = context;
        this.#render = render;
        this.#propsTracker = createPropsTracker(Foundation, (key) => this.#props[key as keyof P]);
        const base: DefaultAdapter<P, S, C> = {
            getContext: (key) => (this.#context as C)?.[key],
            getContexts: () => this.#context,
            getProp: (key) => this.#props[key],
            getProps: () => this.#props,
            getState: (key) => this.#state[key],
            getStates: () => this.#state,
            setState: (partial, callback) => {
                this.#state = { ...this.#state, ...partial };
                // An updater, not a snapshot: React replays updates by lane, so a snapshot leaks a pending transition
                // into an urgent render. The fresh object keeps class-style "setState always re-renders".
                const id = callback ? ++this.#nextId : undefined;
                if (callback) {
                    this.#callbacks.set(id, callback);
                }
                this.#render((prev) => {
                    const next = { ...prev, ...partial };
                    const carried = (this.#applied.get(prev) ?? []).filter((pending) => this.#callbacks.has(pending));
                    this.#applied.set(next, id === undefined ? carried : [...carried, id]);
                    return next;
                });
            },
        };
        this.foundation = new Foundation({ ...base, ...createAdapter(base) } as A);
    }

    sync(props: P, context: C) {
        this.#props = props;
        this.#context = context;
    }

    commit(state: S) {
        for (const id of this.#applied.get(state) ?? []) {
            const callback = this.#callbacks.get(id);
            if (callback) {
                this.#callbacks.delete(id);
                callback();
            }
        }
        const prev = this.#propsTracker.check();
        if (prev) {
            this.foundation.handlePropsChange(prev);
        }
    }
}

/**
 * Function-component host for a semi-foundation class (host contract: `packages/shared/foundation/src/base/foundation.ts`).
 *
 * - The adapter is created once and reads the latest props, state and context, so foundation methods called from
 *   events and effects never see a stale render's values.
 * - `setState` merges into the state the foundation reads immediately (a read right after a write sees the new
 *   value) and always re-renders, like a class component; its callback runs once a commit shows that update (an
 *   urgent commit that skips a pending transition's update does not run it), before the layout effects the component
 *   declares after this hook (a class ran it after componentDidUpdate).
 *   Render state follows React's update lanes: while a transition is pending, the foundation already reads its
 *   values but urgent renders do not show them yet.
 * - `handlePropsChange` runs in the same layout effect, after the callbacks: the `componentDidUpdate` prevProps
 *   comparison. StrictMode's extra effect pass does not fire it because no prop has changed.
 * - Foundation methods must not run during render; render reads the returned state and values derived from props.
 * - Under StrictMode the initializer runs twice and one instance is discarded, so foundation constructors must
 *   not have side effects; the kept instance goes through init -> destroy -> init. Activity runs destroy on hide and
 *   init on show.
 */
export default function useFoundation<F extends Lifecycle, A extends DefaultAdapter<P, S, any>, P, S extends object, C = HostContext<A>>(
    Foundation: (new (adapter: A) => F) & PropReactions,
    props: P,
    initialState: () => S,
    createAdapter: (base: DefaultAdapter<P, S, C>) => Omit<A, keyof DefaultAdapter<P, S>>,
    context?: C
): [F, S] {
    const [state, setRenderState] = useState(initialState);
    const [host] = useState(() => new FoundationHost(Foundation, createAdapter, props, state, context, setRenderState));

    // the insertion phase runs before every layout effect, so a child's layout effect that calls into this
    // foundation already reads this render's props, as `this.props` would in a class component
    useInsertionEffect(() => {
        host.sync(props, context);
    });

    useLayoutEffect(() => {
        host.commit(state);
    });

    useLayoutEffect(() => {
        host.foundation.connect();
        host.foundation.init();
        return () => {
            host.foundation.destroy();
            host.foundation.disconnect();
        };
    }, [host.foundation]);

    return [host.foundation, state];
}
