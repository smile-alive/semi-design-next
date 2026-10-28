import { useState, useMemo } from 'react';
import * as dateFns from 'date-fns';
import { Table, Avatar, type ColumnProps, type RowSelectionProps } from '@fibrae/semi-ui-react';

const DAY = 24 * 60 * 60 * 1000;
const figmaIconUrl = '/assets/placeholder/app.svg';

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
        title: ({ sorter, filter, selection }) => (
            <span style={{ display: 'inline-flex', alignItems: 'center', paddingLeft: 20 }}>
                {selection}
                <span style={{ marginLeft: 8 }}>Name</span>
                {sorter}
                {filter}
            </span>
        ),
        dataIndex: 'name',
        width: 400,
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
        useFullRender: true,
        // The fourth render parameter holds the expand button, selection button and text
        render: (text, _record, _index, { expandIcon, selection, indentText }) => {
            return (
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {indentText}
                    {expandIcon}
                    {selection}
                    <span style={{ marginLeft: 8 }}>
                        <Avatar size="small" shape="square" src={figmaIconUrl} alt="" style={{ marginRight: 12 }} />
                        {text}
                    </span>
                </span>
            );
        },
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
];

const getData = (total: number) => {
    const data: Row[] = [];
    for (let i = 0; i < total; i++) {
        const isSemiDesign = i % 2 === 0;
        const randomNumber = (i * 1000) % 199;
        data.push({
            key: '' + i,
            name: isSemiDesign ? `Semi Design 设计稿${i}.fig` : `Semi D2C 设计稿${i}.fig`,
            owner: isSemiDesign ? '姜鹏志' : '郝宣',
            size: randomNumber,
            updateTime: new Date(2019, 6, 23, 12).valueOf() + randomNumber * DAY,
            avatarBg: isSemiDesign ? 'grey' : 'red',
        });
    }
    return data;
};

export default function TableDemo() {
    const [dataSource] = useState(() => getData(46));
    const pagination = useMemo(
        () => ({
            pageSize: 12,
        }),
        []
    );

    const rowSelection = useMemo<RowSelectionProps<Row>>(() => {
        return {
            hidden: true,
            fixed: 'left',
        };
    }, []);

    return <Table pagination={pagination} rowSelection={rowSelection} columns={columns} dataSource={dataSource} onChange={(...args) => console.log(...args)} expandedRowRender={(record) => <article>{record.name}</article>} />;
}
