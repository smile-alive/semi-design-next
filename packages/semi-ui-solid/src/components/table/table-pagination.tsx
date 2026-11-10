import { type JSX, Show, createMemo, untrack } from 'solid-js';
import { cssClasses } from '@fibrae/semi-foundation/components/table/constants';
import Pagination from '../pagination';
import type { RenderPagination, TablePaginationProps } from './interface';

export interface TablePaginationPartProps {
    prefixCls?: string;
    pagination: TablePaginationProps;
    info?: JSX.Element;
    renderPagination?: RenderPagination;
}

export default function TablePagination(props: TablePaginationPartProps) {
    const customPagination = createMemo(() => {
        const render = props.renderPagination;
        const pagination = props.pagination;
        return typeof render === 'function' ? untrack(() => render(pagination)) : null;
    });

    const paginationProps = createMemo(() => {
        // Table-only keys: Pagination puts unknown props on its root element
        const { position: _position, formatPageText: _formatPageText, ...rest } = props.pagination;
        return rest;
    });

    const prefixCls = () => props.prefixCls ?? cssClasses.PREFIX;

    return (
        <div class={`${prefixCls()}-pagination-outer`}>
            <Show when={customPagination() == null || typeof customPagination() === 'boolean'} fallback={customPagination()}>
                <span class={`${prefixCls()}-pagination-info`}>{props.info}</span>
                <span class={`${prefixCls()}-pagination-wrapper`}>
                    <Show when={(props.pagination.total ?? 0) > 0}>
                        <Pagination {...paginationProps()} />
                    </Show>
                </span>
            </Show>
        </div>
    );
}
