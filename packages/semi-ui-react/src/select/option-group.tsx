import type React from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/select/constants';
import type { ElementProps } from '../_base/base';

export interface OptionGroupProps extends ElementProps<'div'> {
    children?: React.ReactNode;
    label?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}
const prefixCls = cssClasses.PREFIX_GROUP;

function OptionGroup({ label, className, style, children, ...rest }: OptionGroupProps): React.ReactNode {
    if (!label && typeof label !== 'number') {
        return null;
    }

    return (
        <div {...rest} className={clsx(className, prefixCls)} style={style}>
            {label}
        </div>
    );
}

export default Object.assign(OptionGroup, { elementType: 'Select.OptGroup' });
