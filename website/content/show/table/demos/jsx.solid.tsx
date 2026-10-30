import { IconMore } from '@fibrae/semi-icons-solid';
import { Table, Avatar, type AvatarColor } from '@fibrae/semi-ui-solid';

interface Row {
    key: string;
    name: string;
    nameIconSrc: string;
    size: string;
    owner: string;
    status: string;
    updateTime: string;
    avatarBg: AvatarColor;
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
];

function renderName(text: string, record: Row) {
    return (
        <div>
            <Avatar size="small" shape="square" src={record.nameIconSrc} alt="" style={{ 'margin-right': '12px' }} />
            {text}
        </div>
    );
}

function renderOwner(text: string, record: Row) {
    return (
        <div>
            <Avatar size="small" color={record.avatarBg} style={{ 'margin-right': '4px' }}>
                {typeof text === 'string' && text.slice(0, 1)}
            </Avatar>
            {text}
        </div>
    );
}

export default function TableDemo() {
    return (
        <Table dataSource={data} pagination={false}>
            <Table.Column title="标题" dataIndex="name" key="name" render={renderName} />
            <Table.Column title="大小" dataIndex="size" key="size" />
            <Table.Column title="所有者" dataIndex="owner" key="owner" render={renderOwner} />
            <Table.Column title="更新时间" dataIndex="updateTime" key="updateTime" />
            <Table.Column title="" dataIndex="operate" key="operate" render={() => <IconMore />} />
        </Table>
    );
}
