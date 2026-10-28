import { inject } from 'vue';
// Default props are read by every top-level component, including deep imports.
import '@fibrae/semi-foundation/base/tokens.scss';
import semiGlobal, { type OverrideDefaultProps, type SemiGlobal, semiGlobalKey } from '../_utils/semi-global';

export function useSemiGlobal() {
    return inject(semiGlobalKey, semiGlobal);
}

type DefaultOf<N extends keyof OverrideDefaultProps, K> = NonNullable<OverrideDefaultProps[N]>[K & keyof NonNullable<OverrideDefaultProps[N]>];

export function readSemiDefault<N extends keyof OverrideDefaultProps, K extends keyof NonNullable<OverrideDefaultProps[N]>>(semi: SemiGlobal, name: N, key: K, fallback: NonNullable<DefaultOf<N, K>>): NonNullable<DefaultOf<N, K>>;
export function readSemiDefault<N extends keyof OverrideDefaultProps, K extends keyof NonNullable<OverrideDefaultProps[N]>>(semi: SemiGlobal, name: N, key: K): DefaultOf<N, K> | undefined;
export function readSemiDefault<N extends keyof OverrideDefaultProps, K extends keyof NonNullable<OverrideDefaultProps[N]>>(semi: SemiGlobal, name: N, key: K, fallback?: NonNullable<OverrideDefaultProps[N]>[K]): NonNullable<OverrideDefaultProps[N]>[K] | undefined {
    const defaults = semi.config.overrideDefaultProps?.[name] as Partial<Record<K, NonNullable<OverrideDefaultProps[N]>[K]>> | undefined;
    const value = defaults?.[key];
    return value !== undefined ? value : fallback;
}

/**
 * withDefaults entry for a prop whose only default is the global one, which may be missing.
 * Typed as `undefined` because Vue drops `undefined` from props with a factory default; it is still called.
 * Function-typed props cannot use it: Vue would take the factory itself as the value.
 */
export function semiGlobalDefault<N extends keyof OverrideDefaultProps, K extends keyof NonNullable<OverrideDefaultProps[N]>>(name: N, key: K) {
    return (() => readSemiDefault(useSemiGlobal(), name, key)) as unknown as undefined;
}

// Used inside a withDefaults factory, which Vue types as returning a defined value, so a fallback is required.
export default function semiDefault<N extends keyof OverrideDefaultProps, K extends keyof NonNullable<OverrideDefaultProps[N]>>(name: N, key: K, fallback: NonNullable<DefaultOf<N, K>>) {
    return readSemiDefault(useSemiGlobal(), name, key, fallback);
}
