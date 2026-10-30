import * as dateFns from 'date-fns';
import { Table, Avatar, Button, type ColumnProps, type TableProps } from '@fibrae/semi-ui-solid';

const DAY = 24 * 60 * 60 * 1000;

interface Row {
    key: string;
    name: string;
    owner: string;
    size: number;
    updateTime: number;
    avatarBg: 'grey' | 'red';
}

type VirtualizedList = Parameters<NonNullable<TableProps['getVirtualizedListRef']>>[0];

const columns: ColumnProps<Row>[] = [
    {
        title: '标题',
        dataIndex: 'name',
        width: 200,
        fixed: true,
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
        width: 150,
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
        fixed: 'right',
        width: 150,
        sorter: (a, b) => (a.updateTime - b.updateTime > 0 ? 1 : -1),
        render: (value) => {
            return dateFns.format(new Date(value), 'yyyy-MM-dd');
        },
    },
];

function getData() {
    const data: Row[] = [];
    for (let i = 0; i < 1000; i++) {
        const isSemiDesign = i % 2 === 0;
        const randomNumber = (i * 1000) % 199;
        data.push({
            key: '' + i,
            name: isSemiDesign ? `Semi Design 设计稿${i}.fig` : `Semi D2C 设计稿${i}.fig`,
            owner: isSemiDesign ? '姜鹏志' : '郝宣',
            size: randomNumber,
            updateTime: new Date(2024, 4, 6, 12).valueOf() + randomNumber * DAY,
            avatarBg: isSemiDesign ? 'grey' : 'red',
        });
    }
    return data;
}

const dataSource = getData();

const scroll = { y: 400, x: 900 };
const style = { width: '750px', margin: '0 auto' };

export default function TableDemo() {
    let virtualizedList: VirtualizedList | undefined;

    return (
        <>
            <Button onClick={() => virtualizedList?.scrollToItem(100)}>Scroll to 100</Button>
            <Table
                pagination={false}
                columns={columns}
                dataSource={dataSource}
                scroll={scroll}
                style={style}
                virtualized
                getVirtualizedListRef={(list) => {
                    virtualizedList = list;
                }}
            />
        </>
    );
}
