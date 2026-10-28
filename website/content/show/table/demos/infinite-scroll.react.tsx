import { useState } from 'react';
import * as dateFns from 'date-fns';
import { Table, Avatar, type ColumnProps, type TableVirtualizedProps } from '@fibrae/semi-ui-react';

const DAY = 24 * 60 * 60 * 1000;

interface Row {
    key: string;
    name: string;
    owner: string;
    size: number;
    updateTime: number;
    avatarBg: 'grey' | 'red';
}

const columns: ColumnProps<Row>[] = [
    {
        title: '标题',
        dataIndex: 'name',
        width: 200,
        fixed: true,
        render: (text) => {
            return <div>{text}</div>;
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
        fixed: 'right',
        width: 150,
        sorter: (a, b) => (a.updateTime - b.updateTime > 0 ? 1 : -1),
        render: (value) => {
            return dateFns.format(new Date(value), 'yyyy-MM-dd');
        },
    },
];

const pageSize = 20; // 每次加载 20 条

const getPage = (start: number) => {
    const page: Row[] = [];
    for (let i = start; i < start + pageSize; i++) {
        const isSemiDesign = i % 2 === 0;
        const randomNumber = (i * 1000) % 199;
        page.push({
            key: '' + i,
            name: isSemiDesign ? `Semi Design 设计稿${i}.fig` : `Semi D2C 设计稿${i}.fig`,
            owner: isSemiDesign ? '姜鹏志' : '郝宣',
            size: randomNumber,
            updateTime: new Date(2019, 6, 23, 12).valueOf() + randomNumber * DAY,
            avatarBg: isSemiDesign ? 'grey' : 'red',
        });
    }
    return page;
};

export default function TableDemo() {
    const [data, setData] = useState(() => getPage(0));

    const scroll = { y: 600, x: 1000 };
    const style = { width: 750, margin: '0 auto' };

    const loadMore = () => {
        setData([...data, ...getPage(data.length)]);
    };

    const itemSize = 56;
    const virtualized: TableVirtualizedProps = {
        itemSize,
        onScroll: ({ scrollDirection, scrollOffset = 0, scrollUpdateWasRequested }) => {
            if (scrollDirection === 'forward' && scrollOffset >= (data.length - Math.ceil(scroll.y / itemSize) * 1.5) * itemSize && !scrollUpdateWasRequested) {
                loadMore();
            }
        },
    };

    return <Table pagination={false} columns={columns} dataSource={data} scroll={scroll} style={style} virtualized={virtualized} />;
}
