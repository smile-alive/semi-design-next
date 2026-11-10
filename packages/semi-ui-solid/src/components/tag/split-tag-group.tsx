import { splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/tag/constants';
import '@fibrae/semi-foundation/components/tag/tag.scss';
import { type ElementProps, useDefaultProps } from '../../base/index';

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
