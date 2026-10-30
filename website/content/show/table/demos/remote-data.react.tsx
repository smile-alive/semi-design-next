import { useState, useEffect } from 'react';
import * as dateFns from 'date-fns';
import { IconTickCircle, IconComment, IconClear } from '@fibrae/semi-icons-react';
import { Table, Avatar, Tag, type ColumnProps } from '@fibrae/semi-ui-react';

const DAY = 24 * 60 * 60 * 1000;
const figmaIconUrl = '/assets/placeholder/app.svg';
const pageSize = 5;

interface Row {
    key: string;
    name: string;
    owner: string;
    size: number;
    status: 'success' | 'wait';
    updateTime: number;
    avatarBg: 'grey' | 'red';
}

const columns: ColumnProps<Row>[] = [
    {
        title: '标题',
        dataIndex: 'name',
        width: 400,
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
        title: '交付状态',
        dataIndex: 'status',
        render: (text: 'success' | 'pending' | 'wait') => {
            const tagConfig = {
                success: { color: 'green', prefixIcon: <IconTickCircle />, text: '已交付' },
                pending: { color: 'pink', prefixIcon: <IconClear />, text: '已延期' },
                wait: { color: 'cyan', prefixIcon: <IconComment />, text: '待评审' },
            } as const;
            const tagProps = tagConfig[text];
            return (
                <Tag shape="circle" {...tagProps} style={{ userSelect: 'text' }}>
                    {tagProps.text}
                </Tag>
            );
        },
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

function getData() {
    const data: Row[] = [];
    for (let i = 0; i < 46; i++) {
        const isSemiDesign = i % 2 === 0;
        const randomNumber = (i * 1000) % 199;
        data.push({
            key: '' + i,
            name: isSemiDesign ? `Semi Design 设计稿${i}.fig` : `Semi D2C 设计稿${i}.fig`,
            owner: isSemiDesign ? '姜鹏志' : '郝宣',
            size: randomNumber,
            status: isSemiDesign ? 'success' : 'wait',
            updateTime: new Date(2019, 6, 23, 12).valueOf() + randomNumber * DAY,
            avatarBg: isSemiDesign ? 'grey' : 'red',
        });
    }
    return data;
}

const data = getData();

function fetchData(currentPage: number) {
    return new Promise<Row[]>((res) => {
        setTimeout(() => {
            res(data.slice((currentPage - 1) * pageSize, currentPage * pageSize));
        }, 300);
    });
}

export default function TableDemo() {
    const [dataSource, setData] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setPage] = useState(1);

    const handlePageChange = (page: number) => {
        setLoading(true);
        setPage(page);
    };

    useEffect(() => {
        // Drop responses for pages the user has left
        let ignore = false;
        void fetchData(currentPage).then((dataSource) => {
            if (!ignore) {
                setLoading(false);
                setData(dataSource);
            }
        });
        return () => {
            ignore = true;
        };
    }, [currentPage]);

    return (
        <Table
            columns={columns}
            dataSource={dataSource}
            pagination={{
                currentPage,
                pageSize: 5,
                total: data.length,
                onPageChange: handlePageChange,
            }}
            loading={loading}
        />
    );
}
