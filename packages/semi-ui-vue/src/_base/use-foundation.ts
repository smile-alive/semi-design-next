import { type ShallowRef, markRaw, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue';
import { type DefaultAdapter, type HostContext, type Lifecycle, type PropReactions, createPropsTracker } from '@fibrae/semi-foundation/base/foundation';

/**
 * Hosts a semi-foundation class in a Vue component (host contract: `semi-foundation/src/base/foundation.ts`).
 *
 * - `connect` and `init` run in onMounted, `destroy` and `disconnect` in onBeforeUnmount. KeepAlive deactivation calls
 *   neither; a component that must release what `init` set up while cached uses `useKeepAliveFoundation`.
 * - State is a shallowRef replaced on every `setState`, so a read right after a write sees the new value; callbacks and
 *   `handlePropsChange` run in post-flush watchers, after the DOM shows the update, in that order.
 * - `options.props` overrides individual keys as the foundation sees them (e.g. `modelValue` read as `checked`, a
 *   runtime default), in initial state, getProp, getProps and the `propKeys` comparison alike.
 * - The instance stays markRaw: a reactive proxy cannot access a foundation's native private fields.
 */
export default function useFoundation<F extends Lifecycle, A extends DefaultAdapter<P, S, any>, P extends object, S extends object, C = HostContext<A>>(
    Foundation: (new (adapter: A) => F) & PropReactions,
    props: Readonly<Partial<P>>,
    initialState: (props: P) => S,
    createAdapter: (base: DefaultAdapter<P, S, C>) => Omit<A, keyof DefaultAdapter<P, S>>,
    options: { context?: () => C; props?: { [K in keyof P]?: () => P[K] } } = {}
): { foundation: F; state: Readonly<ShallowRef<S>> } {
    let callbacks: (() => void)[] = [];

    const getProp = <K extends keyof P>(key: K) => {
        const getter = options.props?.[key];
        return getter ? getter() : (props as P)[key];
    };

    const getProps = () => {
        const view = { ...props } as P;
        for (const key of Object.keys(options.props ?? {}) as (keyof P)[]) {
            view[key] = getProp(key);
        }
        return view;
    };

    const state = shallowRef(initialState(getProps())) as ShallowRef<S>;

    const base: DefaultAdapter<P, S, C> = {
        getContext: (key) => (options.context?.() as C)?.[key] as C[typeof key],
        getContexts: () => options.context?.() as C,
        getProp,
        getProps,
        getState: (key) => state.value[key],
        getStates: () => state.value,
        setState: (partial, callback) => {
            state.value = { ...state.value, ...partial };
            if (callback) {
                callbacks.push(callback);
            }
        },
    };

    const foundation = markRaw(new Foundation({ ...base, ...createAdapter(base) } as A));

    watch(
        state,
        () => {
            const pending = callbacks;
            callbacks = [];
            for (const callback of pending) {
                callback();
            }
        },
        { flush: 'post' }
    );

    if (Foundation.propKeys.length > 0) {
        const tracker = createPropsTracker(Foundation, (key) => getProp(key as keyof P));
        // the getter only subscribes to the keys; a fresh array makes every trigger reach the tracker's comparison
        watch(
            () => Foundation.propKeys.map((key) => getProp(key as keyof P)),
            () => {
                const prev = tracker.check();
                if (prev) {
                    foundation.handlePropsChange(prev);
                }
            },
            { flush: 'post' }
        );
    }

    onMounted(() => {
        foundation.connect();
        foundation.init();
    });

    onBeforeUnmount(() => {
        foundation.destroy();
        foundation.disconnect();
        callbacks = [];
    });

    return { foundation, state };
}
