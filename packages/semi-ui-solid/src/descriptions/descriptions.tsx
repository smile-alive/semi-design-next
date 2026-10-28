import { children, createMemo, For, Index, Show, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/descriptions/constants';
import DescriptionsFoundation from '@fibrae/semi-foundation/descriptions/foundation';
import warning from '@fibrae/semi-foundation/utils/warning';
import '@fibrae/semi-foundation/descriptions/descriptions.scss';
import hasContent from '../_base/has-content';
import { isToken, type Token } from '../_base/token';
import useDefaultProps from '../_base/use-default-props';
import { DescriptionsContext } from './context';
import type { Data, DescriptionsItemProps, DescriptionsProps } from './interface';
import Item, { DESCRIPTIONS_ITEM } from './item';
import DescriptionsItemView from './item-view';

const prefixCls = cssClasses.PREFIX;

const defaultProps = {
    align: 'center',
    row: false,
    size: 'medium',
    layout: 'vertical',
    column: 3,
} satisfies Partial<DescriptionsProps>;

// What the horizontal layout needs to place a column; the item props stay untouched so children is read only where it renders
type Column = { hidden?: boolean; span?: number } & ({ item: DescriptionsItemProps } | { data: Data; index: number });

function Descriptions(rawProps: DescriptionsProps) {
    const props = useDefaultProps('Descriptions', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['align', 'children', 'class', 'column', 'data', 'layout', 'renderKey', 'renderValue', 'row', 'size']);

    const resolved = children(() => local.children);

    const tokens = createMemo(() =>
        resolved.toArray().flatMap((node) => {
            const isItem = isToken<DescriptionsItemProps>(node, DESCRIPTIONS_ITEM);
            warning(!isItem && hasContent(node), '[Semi Descriptions] Only Descriptions.Item is rendered as a child.');
            return isItem ? [node as Token<DescriptionsItemProps>] : [];
        })
    );

    const view = createMemo(() => ({ align: local.align, layout: local.layout }));

    const rows = createMemo(() => {
        if (local.layout !== 'horizontal') {
            return [];
        }
        const list = local.data;
        const columns: Column[] = list?.length ? list.map((data, index) => ({ hidden: data.hidden, span: data.span, data, index })) : tokens().map(({ props: item }) => ({ hidden: item.hidden, span: item.span, item }));
        return DescriptionsFoundation.getHorizontalList(columns, local.column);
    });

    // the item view reads key and value only when the item is shown, so a hidden item never calls the render functions
    const DataItem = (item: { data: Data; index: number; span?: number }) => (
        <DescriptionsItemView hidden={item.data.hidden} span={item.span} keyStyle={item.data.keyStyle} itemKey={local.renderKey ? local.renderKey(item.data, item.index) : item.data.key}>
            {local.renderValue ? local.renderValue(item.data, item.index) : item.data.value}
        </DescriptionsItemView>
    );

    return (
        <DescriptionsContext.Provider value={view}>
            <div
                {...rest}
                class={clsx(prefixCls, local.class, {
                    [`${prefixCls}-${local.align}`]: !local.row,
                    [`${prefixCls}-double`]: local.row,
                    [`${prefixCls}-double-${local.size}`]: local.row,
                    [`${prefixCls}-horizontal`]: local.layout === 'horizontal',
                    [`${prefixCls}-vertical`]: local.layout === 'vertical',
                })}
            >
                <table>
                    <tbody>
                        <Show
                            when={local.layout === 'horizontal'}
                            fallback={
                                <Show when={local.data?.length} fallback={<For each={tokens()}>{(token) => <DescriptionsItemView {...token.props} />}</For>}>
                                    <Index each={local.data}>{(data, index) => <DataItem data={data()} index={index} span={data().span} />}</Index>
                                </Show>
                            }
                        >
                            <For each={rows()}>
                                {(columns) => (
                                    <tr>
                                        <For each={columns}>{(column) => ('item' in column ? <DescriptionsItemView {...column.item} span={column.span} /> : <DataItem data={column.data} index={column.index} span={column.span} />)}</For>
                                    </tr>
                                )}
                            </For>
                        </Show>
                    </tbody>
                </table>
            </div>
        </DescriptionsContext.Provider>
    );
}

export default Object.assign(Descriptions, { Item });
