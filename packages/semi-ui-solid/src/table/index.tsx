import { Show, mergeProps } from 'solid-js';
import { cssClasses, numbers, strings } from '@fibrae/semi-foundation/table/constants';
import useDefaultProps from '../_base/use-default-props';
import useConfig from '../config-provider/use-config';
import Column from './column';
import type { TableProps } from './interface';
import ResizableTable from './resizable-table';
import NormalTable from './table';

const defaultProps = {
    dataSource: [],
    prefixCls: cssClasses.PREFIX,
    childrenRecordName: 'children',
    size: 'default',
    loading: false,
    bordered: false,
    expandCellFixed: false,
    hideExpandedColumn: true,
    showHeader: true,
    indentSize: numbers.DEFAULT_INDENT_WIDTH,
    pagination: true,
    rowKey: 'key',
    defaultExpandedRowKeys: [],
    defaultExpandAllRows: false,
    defaultExpandAllGroupRows: false,
    expandAllRows: false,
    expandAllGroupRows: false,
    expandRowByClick: false,
} satisfies Partial<TableProps>;

function Table(rawProps: TableProps) {
    const props = useDefaultProps('Table', rawProps, defaultProps);

    const config = useConfig();

    const merged = mergeProps(props, {
        get direction() {
            return props.direction ?? config().direction;
        },
    });

    return (
        <Show when={merged.resizable} fallback={<NormalTable {...merged} />}>
            <ResizableTable {...merged} />
        </Show>
    );
}

export * from './interface';

export default Object.assign(Table, {
    Column,
    DEFAULT_KEY_COLUMN_SELECTION: strings.DEFAULT_KEY_COLUMN_SELECTION,
    DEFAULT_KEY_COLUMN_EXPAND: strings.DEFAULT_KEY_COLUMN_EXPAND,
});
