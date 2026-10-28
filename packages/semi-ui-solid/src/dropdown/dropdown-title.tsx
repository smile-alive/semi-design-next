import { splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/dropdown/constants';
import type { ElementProps } from '../_base/element-props';
import { useDropdownContext } from './context';

export interface DropdownTitleProps extends ElementProps<'li'> {}

const prefix = cssClasses.PREFIX;

export default function DropdownTitle(props: DropdownTitleProps) {
    const [local, rest] = splitProps(props, ['children', 'class']);

    const context = useDropdownContext();

    // presentation keeps the title li out of the menu's items
    return (
        <li role="presentation" {...rest} class={clsx(`${prefix}-title`, { [`${prefix}-title-withTick`]: context?.view().showTick }, local.class)}>
            {local.children}
        </li>
    );
}
