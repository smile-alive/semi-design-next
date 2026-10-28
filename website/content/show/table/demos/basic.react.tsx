import { IconMore, IconTickCircle, IconComment, IconClear } from '@fibrae/semi-icons-react';
import { Table, Avatar, Tag, type ColumnProps } from '@fibrae/semi-ui-react';

export default function TableDemo() {
    const columns: ColumnProps[] = [
        {
            title: '标题',
            dataIndex: 'name',
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
        },
        {
            title: '',
            dataIndex: 'operate',
            render: () => {
                return <IconMore />;
            },
        },
    ];
    const data = [
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
    ];

    return <Table columns={columns} dataSource={data} pagination={false} />;
}
