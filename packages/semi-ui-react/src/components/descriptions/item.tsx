import type React from 'react';
import { memo } from 'react';
import clsx from 'clsx';
import { type DescriptionsItemPart, cssClasses } from '@fibrae/semi-foundation/components/descriptions/constants';
import '@fibrae/semi-foundation/components/descriptions/descriptions.scss';
import type { ElementProps } from '../../base/index';
import { useDescriptionsContext } from './context';

export interface DescriptionsItemProps extends ElementProps<'tr', 'children'> {
    hidden?: boolean;
    className?: string;
    children?: React.ReactNode | (() => React.ReactNode);
    style?: React.CSSProperties;
    itemKey?: React.ReactNode;
    span?: number;
    /** Applied after the `itemKey` and `itemValue` classNames of the parent Descriptions */
    classNames?: Partial<Record<DescriptionsItemPart, string>>;
    styles?: Partial<Record<DescriptionsItemPart, React.CSSProperties>>;
    /** Attached to the tr; unused in horizontal layout, which renders only cells */
    ref?: React.Ref<HTMLTableRowElement>;
}

const prefixCls = cssClasses.PREFIX;
const keyCls = `${prefixCls}-key`;
const valCls = `${prefixCls}-value`;

function Item({ ref, itemKey, hidden, span, children, classNames, styles, ...rest }: DescriptionsItemProps) {
    const { align, layout, classNames: parentClassNames, styles: parentStyles } = useDescriptionsContext();

    const keyClassName = clsx(keyCls, parentClassNames?.itemKey, classNames?.key);
    const keyStyle = { ...parentStyles?.itemKey, ...styles?.key };

    if (hidden) {
        return null;
    }

    const value = (
        <span className={clsx(valCls, parentClassNames?.itemValue, classNames?.value)} style={{ ...parentStyles?.itemValue, ...styles?.value }}>
            {typeof children === 'function' ? children() : children}
        </span>
    );

    const cells =
        align === 'plain' ? (
            <td className={`${prefixCls}-item`} colSpan={span || 1}>
                <span className={keyClassName} style={keyStyle}>
                    {itemKey}:
                </span>
                {value}
            </td>
        ) : (
            <>
                <th className={`${prefixCls}-item ${prefixCls}-item-th`}>
                    <span className={keyClassName} style={keyStyle}>
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
