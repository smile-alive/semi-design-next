import { type ShallowRef, markRaw, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue';
import type { DefaultAdapter, HostContext } from '@fibrae/semi-foundation/base/foundation';

interface Lifecycle {
    connect: () => void;
    disconnect: () => void;
    init?: () => void;
    destroy?: () => void;
}

/**
 * `options.props` overrides individual keys as the foundation sees them (e.g. `modelValue` read as `checked`),
 * in initialization, getProp and getProps alike.
 */
export default function useFoundation<F extends Lifecycle, A extends DefaultAdapter<P, S, any>, P extends object, S extends object, C = HostContext<A>>(
    Foundation: new (adapter: A) => F,
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

    // A reactive proxy cannot access a foundation's native private fields.
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

    onMounted(() => {
        foundation.connect();
        foundation.init?.();
    });

    onBeforeUnmount(() => {
        foundation.destroy?.();
        foundation.disconnect();
        callbacks = [];
    });

    return { foundation, state };
}
