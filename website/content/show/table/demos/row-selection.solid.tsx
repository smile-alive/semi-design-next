import { IconTickCircle, IconComment, IconClear, IconMore } from '@fibrae/semi-icons-solid';
import { Table, Avatar, Tag, type ColumnProps, type RowSelectionProps } from '@fibrae/semi-ui-solid';

interface Row {
    key: string;
    name: string;
    nameIconSrc: string;
    size: string;
    owner: string;
    status: 'success' | 'pending' | 'wait';
    updateTime: string;
    avatarBg: 'grey' | 'red' | 'light-blue';
}

const data: Row[] = [
    {
        key: '1',
        name: 'Semi Design 设计稿.fig',
        nameIconSrc: '/assets/placeholder/app.svg',
        size: '2M',
        owner: '姜鹏志',
        status: 'success',
        updateTime: '2020-02-02 05:13',
        avatarBg: 'grey',
    },
    {
        key: '2',
        name: 'Semi Design 分享演示文稿',
        nameIconSrc: '/assets/docs-icon.png',
        size: '2M',
        owner: '郝宣',
        status: 'pending',
        updateTime: '2020-01-17 05:31',
        avatarBg: 'red',
    },
    {
        key: '3',
        name: '设计文档',
        nameIconSrc: '/assets/docs-icon.png',
        size: '34KB',
        status: 'wait',
        owner: 'Zoey Edwards',
        updateTime: '2020-01-26 11:01',
        avatarBg: 'light-blue',
    },
    {
        key: '4',
        name: 'Semi D2C 设计稿.fig',
        nameIconSrc: '/assets/placeholder/app.svg',
        size: '2M',
        owner: '姜鹏志',
        status: 'wait',
        updateTime: '2020-02-02 05:13',
        avatarBg: 'grey',
    },
    {
        key: '5',
        name: 'Semi D2C 分享演示文稿',
        nameIconSrc: '/assets/docs-icon.png',
        size: '2M',
        owner: '郝宣',
        status: 'pending',
        updateTime: '2020-01-17 05:31',
        avatarBg: 'red',
    },
    {
        key: '6',
        name: 'Semi D2C 设计文档',
        nameIconSrc: '/assets/docs-icon.png',
        size: '34KB',
        status: 'success',
        owner: 'Zoey Edwards',
        updateTime: '2020-01-26 11:01',
        avatarBg: 'light-blue',
    },
];

const columns: ColumnProps<Row>[] = [
    {
        title: '标题',
        dataIndex: 'name',
        width: 400,
        render: (text, record) => {
            return (
                <div>
                    <Avatar size="small" shape="square" src={record.nameIconSrc} alt="" style={{ 'margin-right': '12px' }} />
                    {text}
                </div>
            );
        },
    },
    {
        title: '大小',
        dataIndex: 'size',
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
    },
    {
        title: '',
        dataIndex: 'operate',
        render: () => <IconMore />,
    },
];

const rowSelection: RowSelectionProps<Row> = {
    getCheckboxProps: (record) => ({
        disabled: record.name === '设计文档', // 这一行不可勾选
        name: record.name,
    }),
    onSelect: (record, selected) => {
        console.log(`select row: ${selected}`, record);
    },
    onSelectAll: (selected, selectedRows) => {
        console.log(`select all rows: ${selected}`, selectedRows);
    },
    onChange: (selectedRowKeys, selectedRows) => {
        console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
    },
};

const pagination = { pageSize: 3 };

export default function TableDemo() {
    return <Table columns={columns} dataSource={data} rowSelection={rowSelection} pagination={pagination} />;
}
