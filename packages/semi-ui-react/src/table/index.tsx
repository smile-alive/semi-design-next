import { Suspense, lazy, memo } from 'react';
import { strings, cssClasses, numbers } from '@fibrae/semi-foundation/table/constants';
import { noop } from '@fibrae/semi-foundation/utils/function';
import useDefaultProps from '../_base/use-default-props';
import useIsServerRender from '../_base/use-is-server-render';
import { useConfigContext } from '../config-provider/context';
import Column from './column';
import type { TableProps, Data } from './interface';
import NormalTable from './table';

const ResizableTable = lazy(() => import('./resizable-table'));

const defaultProps = {
    dataSource: [],
    prefixCls: cssClasses.PREFIX,
    rowSelection: null,
    className: '',
    childrenRecordName: 'children',
    size: 'default',
    loading: false,
    bordered: false,
    expandCellFixed: false,
    hideExpandedColumn: true,
    showHeader: true,
    indentSize: numbers.DEFAULT_INDENT_WIDTH,
    onChange: noop,
    pagination: true,
    rowKey: 'key',
    defaultExpandedRowKeys: [],
    defaultExpandAllRows: false,
    defaultExpandAllGroupRows: false,
    expandAllRows: false,
    expandAllGroupRows: false,
    onExpand: noop,
    onExpandedRowsChange: noop,
    expandRowByClick: false,
} satisfies Partial<TableProps>;

function Table<RecordType extends Record<string, any> = Data>(rawProps: TableProps<RecordType>) {
    const props = useDefaultProps('Table', rawProps, defaultProps);
    const { resizable, ...rest } = props;

    const { direction: contextDirection } = useConfigContext();

    const isServerRender = useIsServerRender();

    const direction = props.direction ?? contextDirection;

    // renderToString does not wait for lazy and would leave a boundary that hydration renders over again
    if (resizable && !isServerRender) {
        return (
            <Suspense fallback={<NormalTable<RecordType> {...rest} direction={direction} />}>
                <ResizableTable {...rest} direction={direction} resizable={resizable} />
            </Suspense>
        );
    }

    return <NormalTable<RecordType> {...rest} direction={direction} />;
}

export * from './interface';

export default Object.assign(memo(Table) as typeof Table, {
    Column,
    DEFAULT_KEY_COLUMN_SELECTION: strings.DEFAULT_KEY_COLUMN_SELECTION,
    DEFAULT_KEY_COLUMN_EXPAND: strings.DEFAULT_KEY_COLUMN_EXPAND,
});
