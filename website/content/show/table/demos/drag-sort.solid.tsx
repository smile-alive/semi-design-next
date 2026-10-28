import { createMemo, createSignal, splitProps, type JSX } from 'solid-js';
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
import { Accessibility } from '@dnd-kit/dom';
import { arrayMove } from '@dnd-kit/helpers';
import { DragDropProvider } from '@dnd-kit/solid';
import { isSortable, useSortable } from '@dnd-kit/solid/sortable';
import * as dateFns from 'date-fns';
import { Table, Avatar, type ColumnProps, type OnRowReturnObject, type TableProps } from '@fibrae/semi-ui-solid';

interface DemoRow {
    key: string;
    name: string;
    owner: string;
    size: number;
    updateTime: number;
    avatarBg: 'grey' | 'red';
}

const getData = () => {
    const data: DemoRow[] = [];
    for (let i = 0; i < 46; i++) {
        const isSemiDesign = i % 2 === 0;
        const randomNumber = (i * 1000) % 199;
        data.push({
            key: '' + i,
            name: isSemiDesign ? `Semi Design 设计稿${i}.fig` : `Semi D2C 设计稿${i}.fig`,
            owner: isSemiDesign ? '姜鹏志' : '郝宣',
            size: randomNumber,
            updateTime: new Date(2024, 4, 6, 12).valueOf() + randomNumber,
            avatarBg: isSemiDesign ? 'grey' : 'red',
        });
    }
    return data;
};

interface SortableRowProps extends JSX.HTMLAttributes<HTMLTableRowElement> {
    index: number;
    'data-row-key': string;
}

// index comes from the table's onRow; it must not reach the tr
function SortableRow(rawProps: SortableRowProps) {
    const [local, rest] = splitProps(rawProps, ['index']);
    const { ref, isDragging } = useSortable({
        get id() {
            return rawProps['data-row-key'];
        },
        get index() {
            return local.index;
        },
    });

    return <tr {...rest} classList={{ isDragging: isDragging() }} ref={(node) => ref(node)} style={{ cursor: 'grabbing', ...(isDragging() ? { 'z-index': 999, position: 'relative' } : {}) }} />;
}

export default function TableDemo() {
    const pageSize = 10;
    const [dataSource, setData] = createSignal(getData());
    const [pageNum, setPageNum] = createSignal(1);
    const pageData = createMemo(() => dataSource().slice((pageNum() - 1) * pageSize, pageNum() * pageSize));

    const columns: ColumnProps<DemoRow>[] = [
        {
            title: '标题',
            dataIndex: 'name',
            width: 400,
            render: (text) => {
                return (
                    <div>
                        <Avatar size="small" shape="square" src="/assets/placeholder/app.svg" alt="" style={{ 'margin-right': '12px' }} />
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
                        <Avatar size="small" color={record.avatarBg} style={{ 'margin-right': '4px' }}>
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
    ];

    // Sortable indexes are relative to the current page
    const handleDragEnd: Parameters<typeof DragDropProvider>[0]['onDragEnd'] = (event) => {
        const { source } = event.operation;
        if (event.canceled || !isSortable(source) || source.initialIndex === source.index) {
            return;
        }
        const offset = (pageNum() - 1) * pageSize;
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
                dataSource={pageData()}
                onRow={(_record, index) => {
                    const rowProps: OnRowReturnObject & { index: number } = { index };
                    return rowProps;
                }}
                pagination={{ currentPage: pageNum(), pageSize: pageSize, total: dataSource().length }}
                onChange={handleChange}
            />
        </DragDropProvider>
    );
}
