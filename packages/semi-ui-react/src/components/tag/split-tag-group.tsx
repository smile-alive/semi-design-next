import type React from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/tag/constants';
import '@fibrae/semi-foundation/components/tag/tag.scss';
import { type ElementProps, useDefaultProps } from '../../base/index';

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
