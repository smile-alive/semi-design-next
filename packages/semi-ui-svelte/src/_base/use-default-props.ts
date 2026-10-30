import { getContext } from 'svelte';
import { omitInstanceIds } from '@fibrae/semi-foundation/base/constants';
// Every top-level component calls this, so the tokens ship with any entry, deep imports included
import '@fibrae/semi-foundation/base/tokens.scss';
import semiGlobal, { type OverrideDefaultProps, type SemiGlobal, semiGlobalKey } from '../_utils/semi-global.js';

type Defaults<N extends keyof OverrideDefaultProps> = NonNullable<OverrideDefaultProps[N]>;

/**
 * Reads `semiGlobal.config.overrideDefaultProps[name]` when the component is created, so apps set it before mounting.
 * The returned reader supplies the `$props()` fallbacks, `let { size = defaults('size', 'middle') } = $props()`, and
 * Svelte applies a fallback only while the prop is `undefined`: a value counts as set when it is not `undefined`.
 */
export default function useDefaultProps<N extends keyof OverrideDefaultProps>(name: N) {
    const semi = getContext<SemiGlobal | undefined>(semiGlobalKey) ?? semiGlobal;
    const defaults: Partial<Defaults<N>> = omitInstanceIds(semi.config.overrideDefaultProps?.[name]);

    function read<K extends keyof Defaults<N>>(key: K): Defaults<N>[K] | undefined;
    function read<K extends keyof Defaults<N>, F>(key: K, fallback: F): Exclude<Defaults<N>[K], undefined> | F;
    function read<K extends keyof Defaults<N>, F>(key: K, fallback?: F) {
        const value = defaults[key];
        return value !== undefined ? value : fallback;
    }

    return read;
}
