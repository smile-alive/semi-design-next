import { splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/tag/constants';
import '@fibrae/semi-foundation/tag/tag.scss';
import type { ElementProps } from '../_base/element-props';
import useDefaultProps from '../_base/use-default-props';

const prefixCls = cssClasses.PREFIX;

export interface SplitTagGroupProps extends ElementProps<'div'> {}

export default function SplitTagGroup(rawProps: SplitTagGroupProps) {
    const props = useDefaultProps('SplitTagGroup', rawProps, {});
    const [local, rest] = splitProps(props, ['children', 'class']);

    return (
        <div {...rest} class={clsx(`${prefixCls}-split`, local.class)} role="group">
            {local.children}
        </div>
    );
}
