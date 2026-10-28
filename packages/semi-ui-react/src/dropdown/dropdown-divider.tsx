import type React from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/dropdown/constants';
import type { ElementProps } from '../_base/base';
import type { BaseProps } from '../_base/base-component';

const prefixCls = cssClasses.PREFIX;

export interface DropdownDividerProps extends BaseProps, ElementProps<'li'> {
    /** Attached to the divider li */
    ref?: React.Ref<HTMLLIElement>;
}

export default function DropdownDivider({ className, children, ...rest }: DropdownDividerProps) {
    // a menu ul accepts only li; APG exposes a menu's group boundary as a separator
    return <li role="separator" {...rest} className={clsx(`${prefixCls}-divider`, className)} />;
}
