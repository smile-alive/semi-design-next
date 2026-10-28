import { splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/dropdown/constants';
import type { ElementProps } from '../_base/element-props';

export interface DropdownDividerProps extends ElementProps<'li'> {}

const prefix = cssClasses.PREFIX;

export default function DropdownDivider(props: DropdownDividerProps) {
    // children are dropped: a separator has no content
    const [local, rest] = splitProps(props, ['children', 'class']);

    // a menu ul accepts only li; APG exposes a menu's group boundary as a separator
    return <li role="separator" {...rest} class={clsx(`${prefix}-divider`, local.class)} />;
}
