import type React from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/tag/constants';
import '@fibrae/semi-foundation/tag/tag.scss';
import type { ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';

const prefixCls = cssClasses.PREFIX;

export interface SplitTagGroupProps extends ElementProps<'div'> {
    /** Attached to the root element */
    ref?: React.Ref<HTMLDivElement>;
}

export default function SplitTagGroup(rawProps: SplitTagGroupProps) {
    const { children, className, ...rest } = useDefaultProps('SplitTagGroup', rawProps, {});

    return (
        <div {...rest} className={clsx(`${prefixCls}-split`, className)} role="group">
            {children}
        </div>
    );
}
