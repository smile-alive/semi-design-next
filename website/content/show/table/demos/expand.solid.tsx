import { IconMore } from '@fibrae/semi-icons-solid';
import { Table, Avatar, Descriptions, Tag, type ColumnProps, type DescriptionsData, type ExpandedRowRender, type RowSelectionProps } from '@fibrae/semi-ui-solid';

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
        width: 500,
        dataIndex: 'name',
        render: (text, record) => {
            return (
                <span>
                    <Avatar size="small" shape="square" src={record.nameIconSrc} alt="" style={{ 'margin-right': '12px' }} />
                    {text}
                </span>
            );
        },
    },
    {
        title: '大小',
        dataIndex: 'size',
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

const expandData: DescriptionsData[][] = [
    [
        { key: '实际用户数量', value: '1,480,000' },
        { key: '7 天留存', value: '98%' },
        { key: '安全等级', value: '3 级' },
        { key: '垂类标签', value: '设计' },
        { key: '认证状态', value: '未认证' },
    ],
    [
        { key: '实际用户数量', value: '2,480,000' },
        { key: '7 天留存', value: '90%' },
        { key: '安全等级', value: '1 级' },
        { key: '垂类标签', value: '模板' },
        { key: '认证状态', value: '已认证' },
    ],
    [
        { key: '实际用户数量', value: '2,920,000' },
        { key: '7 天留存', value: '98%' },
        { key: '安全等级', value: '2 级' },
        { key: '垂类标签', value: '文档' },
        { key: '认证状态', value: '已认证' },
    ],
];

const renderValue = (item: DescriptionsData) => (item.key === '垂类标签' ? <Tag style={{ margin: '0px' }}>{item.value}</Tag> : item.value);

const expandRowRender: ExpandedRowRender<Row> = (_record, index) => <Descriptions align="justify" data={expandData[index]} renderValue={renderValue} />;

export default function TableDemo() {
    return <Table rowKey="name" columns={columns} dataSource={data} expandedRowRender={expandRowRender} rowSelection={rowSelection} pagination={false} />;
}
