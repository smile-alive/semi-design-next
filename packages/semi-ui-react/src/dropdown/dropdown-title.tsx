import type React from 'react';
import { memo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/dropdown/constants';
import type { ElementProps } from '../_base/base';
import type { BaseProps } from '../_base/base-component';
import { useDropdownContext } from './context';

const prefixCls = cssClasses.PREFIX;

export interface DropdownTitleProps extends BaseProps, ElementProps<'li'> {
    /** Attached to the title li */
    ref?: React.Ref<HTMLLIElement>;
}

function DropdownTitle({ className, children, ...rest }: DropdownTitleProps) {
    const { showTick } = useDropdownContext();

    const titleCls = clsx(
        {
            [`${prefixCls}-title`]: true,
            [`${prefixCls}-title-withTick`]: showTick,
        },
        className
    );

    // presentation keeps the title li out of the menu's items
    return (
        <li role="presentation" {...rest} className={titleCls}>
            {children}
        </li>
    );
}

export default memo(DropdownTitle);
