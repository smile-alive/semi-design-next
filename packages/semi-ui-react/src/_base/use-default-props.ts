// Every top-level component calls this hook, so the tokens ship with any entry, deep imports included
import '@fibrae/semi-foundation/base/tokens.scss';
import type semiGlobal from '../_utils/semi-global';
import { readGlobalDefaults } from '../_utils/semi-global';

/**
 * Fills props that are `undefined` from `semiGlobal.config.overrideDefaultProps[name]`, then from the component's
 * own defaults: the rule React applied to class `defaultProps`. Global keys missing from `defaults` are filled
 * too, except the per-instance ids that `readGlobalDefaults` drops. A value counts as set when it is not
 * `undefined`, never by the key being present: that decides whether a prop is controlled, and lets a global
 * `undefined` fall back to the component default.
 * The global config is read on every render, because apps may set it after the module loads. `name` is a key of the
 * global config type, so a component whose name is missing there fails to compile instead of ignoring the config.
 */
export default function useDefaultProps<P extends object, D extends Partial<P>>(name: keyof NonNullable<(typeof semiGlobal)['config']['overrideDefaultProps']>, props: P, defaults: D) {
    const global = readGlobalDefaults(name);
    const merged: Record<string, any> = { ...props };
    for (const key of new Set([...Object.keys(defaults), ...Object.keys(global)])) {
        if (merged[key] === undefined) {
            merged[key] = global[key] !== undefined ? global[key] : defaults[key];
        }
    }
    return merged as P & Required<Pick<P, keyof D & keyof P>>;
}
