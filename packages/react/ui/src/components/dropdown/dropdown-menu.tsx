import type React from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/dropdown/constants';
import DropdownMenuFoundation, { type DropdownContextAdapter } from '@fibrae/semi-foundation/components/dropdown/menu-foundation';
import type { ElementProps } from '../../base/base';
import type { BaseProps } from '../../base/base-component';
import useFoundation from '../../base/use-foundation';
import { useConfigContext } from '../config-provider/context';
import { useDropdownContext } from './context';

type Foundation = DropdownMenuFoundation;
type Adapter = DropdownContextAdapter<DropdownMenuProps, Record<string, never>>;

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

    const [foundation] = useFoundation<Foundation, Adapter, DropdownMenuProps, Record<string, never>>(
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
