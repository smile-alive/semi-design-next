import { type JSX, Show, createMemo, untrack } from 'solid-js';
import { cssClasses } from '@fibrae/semi-foundation/table/constants';
import Pagination from '../pagination';
import type { RenderPagination, TablePaginationProps as PaginationProps } from './interface';

export interface TablePaginationProps {
    prefixCls?: string;
    pagination: PaginationProps;
    info?: JSX.Element;
    renderPagination?: RenderPagination;
}

export default function TablePagination(props: TablePaginationProps) {
    // called again when the pagination changes
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
