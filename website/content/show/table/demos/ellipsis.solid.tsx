import { IconMore } from '@fibrae/semi-icons-solid';
import { Table, type ColumnProps } from '@fibrae/semi-ui-solid';

interface Row {
    key: string;
    name: string;
    nameIconSrc: string;
    size: string;
    owner: string;
    updateTime: string;
    avatarBg: 'grey' | 'red' | 'light-blue';
}

const filters = [
    {
        text: 'Semi Design 设计稿',
        value: 'Semi Design 设计稿',
    },
    {
        text: 'Semi D2C 设计稿',
        value: 'Semi D2C 设计稿',
    },
];

const columns: ColumnProps<Row>[] = [
    {
        title: '标题',
        dataIndex: 'name',
        fixed: true,
        width: 250,
        filters,
        onFilter: (value, record) => record.name.includes(value),
        sorter: (a, b) => (a.name.length - b.name.length > 0 ? 1 : -1),
        ellipsis: true,
    },
    {
        title: '所有者',
        dataIndex: 'owner',
        width: 200,
        ellipsis: true,
    },
    {
        title: '大小',
        dataIndex: 'size',
        ellipsis: true,
    },
    {
        title: '更新日期',
        dataIndex: 'updateTime',
        width: 200,
        ellipsis: true,
    },
    {
        title: '',
        dataIndex: 'operate',
        fixed: 'right',
        align: 'center',
        width: 100,
        render: () => <IconMore />,
    },
];

const data: Row[] = [
    {
        key: '1',
        name: 'Semi is designed based on FA architecture, and the main logic is extracted as Foundation package, which is easy to migrate to other frameworks',
        nameIconSrc: '/assets/placeholder/app.svg',
        size: '2M',
        owner: 'Pengzhi Jiang Pengzhi Jiang Pengzhi Jiang Pengzhi Jiang',
        updateTime: '2020-02-02 05:13',
        avatarBg: 'grey',
    },
    {
        key: '2',
        name: '由抖音前端与 UED 团队维护，易于定制的现代化设计系统，帮助设计师与开发者打造高质量产品。由抖音前端与 UED 团队维护，易于定制的现代化设计系统，帮助设计师与开发者打造高质量产品。',
        nameIconSrc: '/assets/docs-icon.png',
        size: '2M',
        owner: '郝宣郝宣郝宣郝宣郝宣郝宣郝宣郝宣郝宣郝宣郝宣郝宣郝宣郝宣郝宣郝宣',
        updateTime: '2020-02-02 05:13',
        avatarBg: 'red',
    },
    {
        key: '3',
        nameIconSrc: '/assets/docs-icon.png',
        name: 'Semi is designed based on FA architecture, and the main logic is extracted as Foundation package, which is easy to migrate to other frameworks',
        size: '34KB',
        owner: 'Pengzhi Jiang Pengzhi Jiang Pengzhi Jiang Pengzhi Jiang',
        updateTime: '2020-02-02 05:13',
        avatarBg: 'light-blue',
    },
    {
        key: '4',
        name: '由抖音前端与 UED 团队维护，易于定制的现代化设计系统，帮助设计师与开发者打造高质量产品。由抖音前端与 UED 团队维护，易于定制的现代化设计系统，帮助设计师与开发者打造高质量产品。',
        nameIconSrc: '/assets/docs-icon.png',
        size: '34KB',
        owner: '郝宣郝宣郝宣郝宣郝宣郝宣郝宣郝宣郝宣郝宣郝宣郝宣郝宣郝宣郝宣郝宣',
        updateTime: '2020-02-02 05:13',
        avatarBg: 'light-blue',
    },
];

export default function TableDemo() {
    return <Table scroll={{ x: 1200 }} columns={columns} dataSource={data} pagination={false} />;
}
