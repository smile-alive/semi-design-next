import { type JSX, Show, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/descriptions/constants';
import '@fibrae/semi-foundation/components/descriptions/descriptions.scss';
import { useDescriptionsContext } from './context';
import type { DescriptionsItemProps } from './interface';

const prefixCls = cssClasses.PREFIX;
const keyCls = `${prefixCls}-key`;
const valCls = `${prefixCls}-value`;

export default function DescriptionsItemView(props: DescriptionsItemProps) {
    const [local, rest] = splitProps(props, ['children', 'hidden', 'itemKey', 'classNames', 'styles', 'span']);

    const view = useDescriptionsContext();

    const keyClass = () => clsx(keyCls, local.classNames?.key);

    // Solid calls a function child when it inserts it; the type only widens JSX.Element for the Methods docs and React parity
    const value = () => local.children as JSX.Element;

    // one body is shown per use, so props.children is read once
    const cells = () => (
        <Show
            when={view().align === 'plain'}
            fallback={
                <>
                    <th class={`${prefixCls}-item ${prefixCls}-item-th`}>
                        <span class={keyClass()} style={local.styles?.key}>
                            {local.itemKey}
                        </span>
                    </th>
                    <td class={`${prefixCls}-item ${prefixCls}-item-td`} colSpan={local.span ? local.span * 2 - 1 : 1}>
                        <span class={valCls}>{value()}</span>
                    </td>
                </>
            }
        >
            <td class={`${prefixCls}-item`} colSpan={local.span || 1}>
                <span class={keyClass()} style={local.styles?.key}>
                    {local.itemKey}:
                </span>
                <span class={valCls}>{value()}</span>
            </td>
        </Show>
    );

    return (
        <Show when={!local.hidden}>
            {/* horizontal rows are drawn by Descriptions, so only the cells are rendered and rest has no element to land on */}
            <Show when={view().layout !== 'horizontal'} fallback={cells()}>
                <tr {...rest}>{cells()}</tr>
            </Show>
        </Show>
    );
}
