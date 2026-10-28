import { memo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/table/constants';
import { flattenColumns } from '@fibrae/semi-foundation/table/utils';
import type { ColumnProps, TableComponents } from './interface';

export interface ColGroupProps {
    columns?: ColumnProps[];
    prefixCls?: string;
    className?: string;
    style?: React.CSSProperties;
    components?: TableComponents['body'];
}

function ColGroup({ columns = [], className, style, prefixCls = cssClasses.PREFIX, components }: ColGroupProps) {
    const Group = components?.colgroup?.wrapper ?? 'colgroup';
    const Col = components?.colgroup?.col ?? 'col';

    const cols = flattenColumns(columns).map((column: ColumnProps, idx: number) => {
        const colStyle: { width?: number | string; minWidth?: number | string } = {};

        if (column.width) {
            colStyle.width = column.width;
            colStyle.minWidth = colStyle.width;
        }

        return <Col key={column.key ?? column.dataIndex ?? idx} className={clsx(`${prefixCls}-col`, column.className)} style={colStyle} />;
    });

    return (
        <Group className={clsx(`${prefixCls}-colgroup`, className)} style={style}>
            {cols}
        </Group>
    );
}

export default memo(ColGroup);
