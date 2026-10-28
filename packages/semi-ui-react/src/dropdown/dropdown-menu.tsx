import type React from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/dropdown/constants';
import DropdownMenuFoundation, { type DropdownContextAdapter } from '@fibrae/semi-foundation/dropdown/menu-foundation';
import type { ElementProps } from '../_base/base';
import type { BaseProps } from '../_base/base-component';
import useFoundation from '../_base/use-foundation';
import { useConfigContext } from '../config-provider/context';
import { useDropdownContext } from './context';

const prefixCls = cssClasses.PREFIX;
export interface DropdownMenuProps extends BaseProps, ElementProps<'ul'> {
    children: React.ReactNode;
    /** Attached to the menu ul */
    ref?: React.Ref<HTMLUListElement>;
}

export default function DropdownMenu(props: DropdownMenuProps) {
    const { children, className, ...rest } = props;

    const context = useDropdownContext();
    const { direction } = useConfigContext();

    const [foundation] = useFoundation<DropdownMenuFoundation, DropdownContextAdapter<DropdownMenuProps, Record<string, never>>, DropdownMenuProps, Record<string, never>>(
        DropdownMenuFoundation,
        props,
        () => ({}),
        () => ({}),
        { ...context, direction }
    );

    return (
        <ul
            aria-orientation="vertical"
            role="menu"
            {...rest}
            className={clsx(`${prefixCls}-menu`, className)}
            onKeyDown={(e) => {
                rest.onKeyDown?.(e);
                foundation.onMenuKeydown(e);
            }}
        >
            {children}
        </ul>
    );
}
