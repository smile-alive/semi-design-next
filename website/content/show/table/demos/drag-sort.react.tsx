import { useMemo, useState, type ComponentProps, type CSSProperties } from 'react';
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
import { Accessibility } from '@dnd-kit/dom';
import { arrayMove } from '@dnd-kit/helpers';
import { DragDropProvider } from '@dnd-kit/react';
import { isSortable, useSortable } from '@dnd-kit/react/sortable';
import clsx from 'clsx';
import * as dateFns from 'date-fns';
import { Table, Avatar, type ColumnProps, type OnRowReturnObject, type TableProps } from '@fibrae/semi-ui-react';

function getData() {
    const data = [];
    for (let i = 0; i < 46; i++) {
        const isSemiDesign = i % 2 === 0;
        const randomNumber = (i * 1000) % 199;
        data.push({
            key: '' + i,
            name: isSemiDesign ? `Semi Design 设计稿${i}.fig` : `Semi D2C 设计稿${i}.fig`,
            owner: isSemiDesign ? '姜鹏志' : '郝宣',
            size: randomNumber,
            updateTime: new Date(2019, 6, 23, 12).valueOf() + randomNumber,
            avatarBg: isSemiDesign ? 'grey' : 'red',
        });
    }
    return data;
}

interface SortableRowProps extends ComponentProps<'tr'> {
    index: number;
    'data-row-key': string;
}

function SortableRow(props: SortableRowProps) {
    // index comes from the table's onRow; it must not reach the tr
    const { index, ...rowProps } = props;
    const { ref, isDragging } = useSortable({ id: props['data-row-key'], index });
    const style: CSSProperties = {
        ...props.style,
        cursor: 'grabbing',
        ...(isDragging ? { zIndex: 999, position: 'relative' } : {}),
    };
    const rowCls = clsx(props.className, { ['isDragging']: isDragging });

    return <tr {...rowProps} className={rowCls} ref={ref} style={style} />;
}

export default function TableDemo() {
    const pageSize = 10;
    const [dataSource, setData] = useState(getData);
    const [pageNum, setPageNum] = useState(1);
    const pageData = useMemo(() => dataSource.slice((pageNum - 1) * pageSize, pageNum * pageSize), [dataSource, pageNum]);
    const columns = useMemo(
        (): ColumnProps[] => [
            {
                title: '标题',
                dataIndex: 'name',
                width: 400,
                render: (text) => {
                    return (
                        <div>
                            <Avatar size="small" shape="square" src="/assets/placeholder/app.svg" alt="" style={{ marginRight: 12 }} />
                            {text}
                        </div>
                    );
                },
                filters: [
                    {
                        text: 'Semi Design 设计稿',
                        value: 'Semi Design 设计稿',
                    },
                    {
                        text: 'Semi D2C 设计稿',
                        value: 'Semi D2C 设计稿',
                    },
                ],
                onFilter: (value, record) => record.name.includes(value),
            },
            {
                title: '大小',
                dataIndex: 'size',
                sorter: (a, b) => (a.size - b.size > 0 ? 1 : -1),
                render: (text) => `${text} KB`,
            },
            {
                title: '所有者',
                dataIndex: 'owner',
                render: (text, record) => {
                    return (
                        <div>
                            <Avatar size="small" color={record.avatarBg} style={{ marginRight: 4 }}>
                                {typeof text === 'string' && text.slice(0, 1)}
                            </Avatar>
                            {text}
                        </div>
                    );
                },
            },
            {
                title: '更新日期',
                dataIndex: 'updateTime',
                sorter: (a, b) => (a.updateTime - b.updateTime > 0 ? 1 : -1),
                render: (value) => {
                    return dateFns.format(new Date(value), 'yyyy-MM-dd');
                },
            },
        ],
        []
    );

    // Sortable indexes are relative to the current page
    const handleDragEnd: ComponentProps<typeof DragDropProvider>['onDragEnd'] = (event) => {
        const { source } = event.operation;
        if (event.canceled || !isSortable(source) || source.initialIndex === source.index) {
            return;
        }
        const offset = (pageNum - 1) * pageSize;
        setData((prev) => arrayMove(prev, offset + source.initialIndex, offset + source.index));
    };

    const handleChange: TableProps['onChange'] = ({ pagination }) => {
        if (pagination?.currentPage) {
            setPageNum(pagination.currentPage);
        }
    };

    return (
        <DragDropProvider
            // Accessibility would add role="button" and a Tab stop to each row; keep table row semantics
            plugins={(defaults) => defaults.filter((plugin) => plugin !== Accessibility)}
            modifiers={[RestrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
        >
            <Table
                components={{
                    body: {
                        row: SortableRow,
                    },
                }}
                rowKey="key"
                columns={columns}
                dataSource={pageData}
                onRow={(_record, index) => {
                    const rowProps: OnRowReturnObject & { index: number } = { index };
                    return rowProps;
                }}
                pagination={{ currentPage: pageNum, pageSize: pageSize, total: dataSource.length }}
                onChange={handleChange}
            />
        </DragDropProvider>
    );
}
