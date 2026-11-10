import { Show, mergeProps } from 'solid-js';
import { numbers, strings } from '@fibrae/semi-foundation/components/table/constants';
import useDefaultProps from '../../base/use-default-props';
import useConfig from '../config-provider/use-config';
import Column from './column';
import type { TableProps } from './interface';
import NormalTable from './normal-table';
import ResizableTable from './resizable-table';

const defaultProps = {
    dataSource: [],
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

export default Object.assign(Table, {
    Column,
    DEFAULT_KEY_COLUMN_SELECTION: strings.DEFAULT_KEY_COLUMN_SELECTION,
    DEFAULT_KEY_COLUMN_EXPAND: strings.DEFAULT_KEY_COLUMN_EXPAND,
});
