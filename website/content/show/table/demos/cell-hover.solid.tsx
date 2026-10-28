import { IconMore } from '@fibrae/semi-icons-solid';
import { Table, Avatar, type ColumnProps } from '@fibrae/semi-ui-solid';

interface Row {
    key: string;
    name: string;
    nameIconSrc: string;
    size: string;
    owner: string;
    updateTime: string;
    avatarBg: 'grey' | 'red' | 'light-blue';
}

const columns: ColumnProps<Row>[] = [
    {
        title: '标题',
        dataIndex: 'name',
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
        width: 100,
        dataIndex: 'size',
    },
    {
        title: '所有者',
        dataIndex: 'owner',
        width: 200,
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
        width: 300,
        dataIndex: 'updateTime',
    },
    {
        title: '',
        dataIndex: 'operate',
        render: () => <IconMore />,
    },
];

const data: Row[] = [
    {
        key: '1',
        name: 'Semi Design 设计稿.fig',
        nameIconSrc: '/assets/placeholder/app.svg',
        size: '2M',
        owner: '姜鹏志',
        updateTime: '2020-02-02 05:13',
        avatarBg: 'grey',
    },
    {
        key: '2',
        name: 'Semi Design 分享演示文稿',
        nameIconSrc: '/assets/docs-icon.png',
        size: '2M',
        owner: '郝宣',
        updateTime: '2020-01-17 05:31',
        avatarBg: 'red',
    },
    {
        key: '3',
        name: '设计文档',
        nameIconSrc: '/assets/docs-icon.png',
        size: '34KB',
        owner: 'Zoey Edwards',
        updateTime: '2020-01-26 11:01',
        avatarBg: 'light-blue',
    },
];

export default function TableDemo() {
    return <Table columns={columns} dataSource={data} class="component-table-demo-cell-hover-custom" pagination={false} />;
}
