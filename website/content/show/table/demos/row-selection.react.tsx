import { useMemo } from 'react';
import { IconMore, IconTickCircle, IconComment, IconClear } from '@fibrae/semi-icons-react';
import { Table, Avatar, Tag, type ColumnProps, type RowSelectionProps } from '@fibrae/semi-ui-react';

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

export default function TableDemo() {
    const columns = useMemo<ColumnProps<Row>[]>(
        () => [
            {
                title: '标题',
                dataIndex: 'name',
                width: 400,
                render: (text, record) => {
                    return (
                        <div>
                            <Avatar size="small" shape="square" src={record.nameIconSrc} alt="" style={{ marginRight: 12 }} />
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
            },
            {
                title: '',
                dataIndex: 'operate',
                render: () => {
                    return <IconMore />;
                },
            },
        ],
        []
    );

    const data = useMemo<Row[]>(
        () => [
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
        ],
        []
    );

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

    const pagination = useMemo(
        () => ({
            pageSize: 3,
        }),
        []
    );

    return <Table columns={columns} dataSource={data} rowSelection={rowSelection} pagination={pagination} />;
}
