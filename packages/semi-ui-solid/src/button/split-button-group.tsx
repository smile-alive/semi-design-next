import { createSignal, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/button/constants';
import { markEnds } from '@fibrae/semi-foundation/button/utils';
import '@fibrae/semi-foundation/button/button.scss';
import type { ElementProps } from '../_base/element-props';
import mergeRefs from '../_base/merge-refs';
import useDefaultProps from '../_base/use-default-props';
import useMutationObserver from '../_base/use-mutation-observer';

export interface SplitButtonGroupProps extends ElementProps<'div'> {}

const prefix = cssClasses.PREFIX;

export default function SplitButtonGroup(rawProps: SplitButtonGroupProps) {
    const props = useDefaultProps('SplitButtonGroup', rawProps, {});
    const [local, rest] = splitProps(props, ['children', 'class', 'ref']);

    const [root, setRoot] = createSignal<HTMLDivElement>();

    // A re-render can replace a button's class, so mark again whenever classes or buttons change; no records is the
    // initial run.
    useMutationObserver(
        root,
        (mutations) => {
            const changed = !mutations.length || mutations.some((mutation) => mutation.type === 'childList' || (mutation.type === 'attributes' && mutation.attributeName === 'class'));
            const node = root();
            if (changed && node) {
                markEnds(node);
            }
        },
        { attributes: true, childList: true, subtree: true }
    );

    return (
        <div {...rest} ref={mergeRefs(local.ref, setRoot)} class={clsx(`${prefix}-split`, local.class)} role="group">
            {local.children}
        </div>
    );
}
