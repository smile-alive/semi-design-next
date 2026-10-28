import { createResource, createSignal } from 'solid-js';
import * as dateFns from 'date-fns';
import { IconTickCircle, IconComment, IconClear } from '@fibrae/semi-icons-solid';
import { Table, Avatar, Tag, type ColumnProps } from '@fibrae/semi-ui-solid';

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
                    <Avatar size="small" shape="square" src={figmaIconUrl} alt="" style={{ 'margin-right': '12px' }} />
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
        render: (text: Row['status']) => {
            const tagConfig = {
                // getters create only the icon of the row's status
                success: {
                    color: 'green',
                    get prefixIcon() {
                        return <IconTickCircle />;
                    },
                    text: '已交付',
                },
                pending: {
                    color: 'pink',
                    get prefixIcon() {
                        return <IconClear />;
                    },
                    text: '已延期',
                },
                wait: {
                    color: 'cyan',
                    get prefixIcon() {
                        return <IconComment />;
                    },
                    text: '待评审',
                },
            } as const;
            const tagProps = tagConfig[text];
            return (
                <Tag shape="circle" {...tagProps} style={{ 'user-select': 'text' }}>
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

const getData = () => {
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
            updateTime: new Date(2024, 4, 6, 12).valueOf() + randomNumber * DAY,
            avatarBg: isSemiDesign ? 'grey' : 'red',
        });
    }
    return data;
};

const data = getData();

const fetchData = (currentPage: number) => {
    return new Promise<Row[]>((res) => {
        setTimeout(() => {
            res(data.slice((currentPage - 1) * pageSize, currentPage * pageSize));
        }, 300);
    });
};

export default function TableDemo() {
    const [currentPage, setPage] = createSignal(1);
    // createResource drops responses for pages the user has already left
    const [pageData] = createResource(currentPage, fetchData);

    return (
        <Table
            columns={columns}
            dataSource={pageData() ?? []}
            pagination={{
                currentPage: currentPage(),
                pageSize: 5,
                total: data.length,
                onPageChange: setPage,
            }}
            loading={pageData.loading}
        />
    );
}
