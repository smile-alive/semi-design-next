import { splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/dropdown/constants';
import DropdownMenuFoundation, { type DropdownContextAdapter } from '@fibrae/semi-foundation/dropdown/menu-foundation';
import callHandler from '../_base/call-handler';
import type { ElementProps } from '../_base/element-props';
import useFoundation from '../_base/use-foundation';
import useConfig from '../config-provider/use-config';
import { menuContext, useDropdownContext } from './context';

export interface DropdownMenuProps extends ElementProps<'ul'> {}

type Adapter = DropdownContextAdapter<DropdownMenuProps, Record<string, never>>;

const prefix = cssClasses.PREFIX;

export default function DropdownMenu(props: DropdownMenuProps) {
    const [local, rest] = splitProps(props, ['children', 'class', 'onKeyDown']);

    const context = useDropdownContext();
    const config = useConfig();

    const { foundation } = useFoundation<DropdownMenuFoundation, Adapter, DropdownMenuProps, Record<string, never>>(
        DropdownMenuFoundation,
        props,
        () => ({}),
        () => ({}),
        { context: () => menuContext(context, config().direction) }
    );

    // role and aria-orientation come before the consumer's attributes, which may replace them
    return (
        <ul
            aria-orientation="vertical"
            role="menu"
            {...rest}
            class={clsx(`${prefix}-menu`, local.class)}
            onKeyDown={(e) => {
                callHandler(local.onKeyDown, e);
                foundation.onMenuKeydown(e);
            }}
        >
            {local.children}
        </ul>
    );
}
