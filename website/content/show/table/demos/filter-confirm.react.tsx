import { useState } from 'react';
import * as dateFns from 'date-fns';
import { Table, Avatar, type ColumnProps } from '@fibrae/semi-ui-react';

const DAY = 24 * 60 * 60 * 1000;

interface Row {
    key: string;
    name: string;
    owner: string;
    size: number;
    updateTime: number;
    avatarBg: 'grey' | 'red';
}

const getData = () => {
    const data: Row[] = [];
    for (let i = 0; i < 20; i++) {
        const isSemiDesign = i % 2 === 0;
        const randomNumber = (i * 1000) % 199;
        data.push({
            key: '' + i,
            name: isSemiDesign ? `Semi Design 设计稿${i}.fig` : `Semi Pro 首页${i}.fig`,
            owner: isSemiDesign ? '姜鹏志' : '郝宣',
            size: randomNumber,
            updateTime: new Date('2024-01-25').valueOf() + randomNumber * DAY,
            avatarBg: isSemiDesign ? 'grey' : 'red',
        });
    }
    return data;
};

export default function TableDemo() {
    const [dataSource] = useState(getData);

    const figmaIconUrl = '/assets/placeholder/app.svg';

    const columns: ColumnProps<Row>[] = [
        {
            title: '标题',
            dataIndex: 'name',
            width: 300,
            render: (text) => {
                return (
                    <div>
                        <Avatar size="small" shape="square" src={figmaIconUrl} alt="" style={{ marginRight: 12 }} />
                        {text}
                    </div>
                );
            },
            filters: [
                {
                    text: 'Semi Design 设计稿',
                    value: 'Semi Design',
                },
                {
                    text: 'Semi Pro 设计稿',
                    value: 'Semi Pro',
                },
            ],
            onFilter: (value, record) => record.name.includes(value),
            filterMultiple: true,
            filterConfirmMode: 'confirm',
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
            filters: [
                {
                    text: '姜鹏志',
                    value: '姜鹏志',
                },
                {
                    text: '郝宣',
                    value: '郝宣',
                },
            ],
            onFilter: (value, record) => record.owner.includes(value),
            filterMultiple: true,
            filterConfirmMode: 'confirm',
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

    return <Table columns={columns} dataSource={dataSource} />;
}
