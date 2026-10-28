import type React from 'react';
import { isValidElement, useMemo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/descriptions/constants';
import DescriptionsFoundation from '@fibrae/semi-foundation/descriptions/foundation';
import '@fibrae/semi-foundation/descriptions/descriptions.scss';
import type { ElementProps } from '../_base/base';
import flattenChildren from '../_base/flatten-children';
import useDefaultProps from '../_base/use-default-props';
import { DescriptionsContext, type DescriptionsAlign, type DescriptionLayout } from './descriptions-context';
import Item, { type DescriptionsItemProps } from './item';

export type { DescriptionsItemProps } from './item';
export type DescriptionsSize = 'small' | 'medium' | 'large';

export interface Data {
    key?: React.ReactNode;
    value?: (() => React.ReactNode) | React.ReactNode;
    hidden?: boolean;
    span?: number;
    keyStyle?: React.CSSProperties;
}
export interface DescriptionsProps extends ElementProps<'div'> {
    align?: DescriptionsAlign;
    row?: boolean;
    size?: DescriptionsSize;
    style?: React.CSSProperties;
    className?: string;
    children?: React.ReactNode;
    data?: Data[];
    layout?: DescriptionLayout;
    column?: number;
    /** Attached to the root div */
    ref?: React.Ref<HTMLDivElement>;
}

const prefixCls = cssClasses.PREFIX;

const defaultProps = {
    align: 'center',
    row: false,
    size: 'medium',
    data: [],
    layout: 'vertical',
    column: 3,
} satisfies Partial<DescriptionsProps>;

// Only Item elements are columns: any other element would render a cell of its own props
function collectItems(children: React.ReactNode) {
    return flattenChildren(children).filter((node): node is React.ReactElement<DescriptionsItemProps> => isValidElement(node) && node.type === Item);
}

function getColumns(data: Data[], children: React.ReactNode): Data[] {
    if (data?.length) {
        return data;
    }
    return collectItems(children).map((item) => ({ value: item.props.children, ...item.props }));
}

function renderItem({ key, value, ...item }: Data, reactKey: React.Key) {
    return (
        <Item key={reactKey} itemKey={key} {...item}>
            {value}
        </Item>
    );
}

function Descriptions(rawProps: DescriptionsProps) {
    const { ref, align, row, size, className, children, data, layout, column, ...rest } = useDefaultProps('Descriptions', rawProps, defaultProps);

    const contextValue = useMemo(() => ({ align, layout }), [align, layout]);
    const body = layout === 'horizontal' ? DescriptionsFoundation.getHorizontalList(getColumns(data, children), column).map((items, index) => <tr key={index}>{items.map((item, itemIndex) => renderItem(item, `${index}-${itemIndex}`))}</tr>) : data?.length ? data.map(renderItem) : children;

    return (
        <div
            {...rest}
            ref={ref}
            className={clsx(prefixCls, className, {
                [`${prefixCls}-${align}`]: !row,
                [`${prefixCls}-double`]: row,
                [`${prefixCls}-double-${size}`]: row,
                [`${prefixCls}-horizontal`]: layout === 'horizontal',
                [`${prefixCls}-vertical`]: layout === 'vertical',
            })}
        >
            <table>
                <tbody>
                    <DescriptionsContext value={contextValue}>{body}</DescriptionsContext>
                </tbody>
            </table>
        </div>
    );
}

export default Object.assign(Descriptions, { Item });
