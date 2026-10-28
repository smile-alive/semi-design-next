import { mergeProps } from 'solid-js';
// Every top-level component calls this, so the tokens ship with any entry, deep imports included
import '@fibrae/semi-foundation/base/tokens.scss';
import { type OverrideDefaultProps, readGlobalDefaults } from '../_utils/semi-global';

/**
 * Fills props that are `undefined` from `semiGlobal.config.overrideDefaultProps[name]`, then from the component's
 * own defaults. Global keys missing from `defaults` are filled too, except the per-instance ids that
 * `readGlobalDefaults` drops. A value counts as set when it is not `undefined`, never by the key being present: that
 * decides whether a prop is controlled. `mergeProps` already skips `undefined` sources and keeps every prop reactive.
 * The global config is read when the component is created, so apps set it before mounting.
 */
export default function useDefaultProps<P extends object, D extends Partial<P>>(name: keyof OverrideDefaultProps, props: P, defaults: D) {
    return mergeProps(defaults, readGlobalDefaults(name), props) as P & Required<Pick<P, keyof D & keyof P>>;
}
