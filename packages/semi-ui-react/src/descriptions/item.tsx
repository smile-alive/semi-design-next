import type React from 'react';
import { memo } from 'react';
import { cssClasses } from '@fibrae/semi-foundation/descriptions/constants';
import '@fibrae/semi-foundation/descriptions/descriptions.scss';
import type { ElementProps } from '../_base/base';
import { useDescriptionsContext } from './descriptions-context';

export interface DescriptionsItemProps extends ElementProps<'tr', 'children'> {
    hidden?: boolean;
    className?: string;
    children?: React.ReactNode | (() => React.ReactNode);
    style?: React.CSSProperties;
    itemKey?: React.ReactNode;
    span?: number;
    keyStyle?: React.CSSProperties;
    /** Attached to the tr; unused in horizontal layout, which renders only cells */
    ref?: React.Ref<HTMLTableRowElement>;
}

const prefixCls = cssClasses.PREFIX;
const keyCls = `${prefixCls}-key`;
const valCls = `${prefixCls}-value`;

function Item({ ref, itemKey, hidden, span, children, keyStyle, ...rest }: DescriptionsItemProps) {
    const { align, layout } = useDescriptionsContext();

    if (hidden) {
        return null;
    }

    const value = <span className={valCls}>{typeof children === 'function' ? children() : children}</span>;

    const cells =
        align === 'plain' ? (
            <td className={`${prefixCls}-item`} colSpan={span || 1}>
                <span className={keyCls} style={keyStyle}>
                    {itemKey}:
                </span>
                {value}
            </td>
        ) : (
            <>
                <th className={`${prefixCls}-item ${prefixCls}-item-th`}>
                    <span className={keyCls} style={keyStyle}>
                        {itemKey}
                    </span>
                </th>
                <td className={`${prefixCls}-item ${prefixCls}-item-td`} colSpan={span ? span * 2 - 1 : 1}>
                    {value}
                </td>
            </>
        );

    return layout === 'horizontal' ? (
        cells
    ) : (
        <tr {...rest} ref={ref}>
            {cells}
        </tr>
    );
}

export default memo(Item);
