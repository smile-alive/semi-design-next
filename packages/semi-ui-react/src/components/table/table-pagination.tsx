import { memo } from 'react';
import { cssClasses } from '@fibrae/semi-foundation/components/table/constants';
import Pagination from '../pagination';
import type { RenderPagination, TablePaginationProps } from './interface';

export interface TablePaginationPartProps {
    prefixCls?: string;
    pagination?: TablePaginationProps;
    info?: React.ReactNode;
    renderPagination?: RenderPagination;
}

function TablePagination({ pagination, prefixCls = cssClasses.PREFIX, info, renderPagination }: TablePaginationPartProps) {
    const total = pagination?.total;

    // Table-only keys: Pagination puts unknown props on its root element
    const { position, formatPageText, ...paginationProps } = pagination ?? {};
    const customPagination = typeof renderPagination === 'function' ? renderPagination(pagination) : null;

    return (
        <div className={`${prefixCls}-pagination-outer`}>
            {customPagination != null && typeof customPagination !== 'boolean' ? (
                customPagination
            ) : (
                <>
                    <span className={`${prefixCls}-pagination-info`}>{info}</span>
                    <span className={`${prefixCls}-pagination-wrapper`}>{total > 0 && <Pagination {...paginationProps} />}</span>
                </>
            )}
        </div>
    );
}

export default memo(TablePagination);
