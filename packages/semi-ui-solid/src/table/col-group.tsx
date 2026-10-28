import { type JSX, For } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/table/constants';
import { flattenColumns } from '@fibrae/semi-foundation/table/utils';
import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
import type { ColumnProps } from './interface';
import type { MergedTableComponents } from './utils';

export interface ColGroupProps {
    columns?: ColumnProps[];
    prefixCls?: string;
    class?: string;
    style?: JSX.CSSProperties;
    components?: Partial<MergedTableComponents['body']>;
}

export default function ColGroup(props: ColGroupProps) {
    const prefixCls = () => props.prefixCls ?? cssClasses.PREFIX;

    const leafColumns = () => flattenColumns(props.columns ?? []) as ColumnProps[];

    return (
        <Dynamic component={props.components?.colgroup?.wrapper ?? 'colgroup'} class={clsx(`${prefixCls()}-colgroup`, props.class)} style={props.style}>
            <For each={leafColumns()}>{(column) => <Dynamic component={props.components?.colgroup?.col ?? 'col'} class={clsx(`${prefixCls()}-col`, column.class)} style={column.width ? { width: toCssLength(column.width), 'min-width': toCssLength(column.width) } : {}} />}</For>
        </Dynamic>
    );
}
