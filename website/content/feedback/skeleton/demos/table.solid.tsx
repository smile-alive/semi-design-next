import { Skeleton, Table, type ColumnProps } from '@fibrae/semi-ui-solid';

const columns: ColumnProps[] = [
    {
        title: 'Name',
        dataIndex: 'name',
    },
    {
        title: 'Age',
        dataIndex: 'age',
    },
    {
        title: 'Address',
        dataIndex: 'address',
    },
];

const dataSource = [
    {
        key: '1',
        name: 'John Brown',
        age: 32,
        address: 'New York No. 1 Lake Park, New York No. 1 Lake Park',
    },
    {
        key: '2',
        name: 'Jim Green',
        age: 42,
        address: 'London No. 1 Lake Park',
    },
    {
        key: '3',
        name: 'Joe Black',
        age: 32,
        address: 'Sidney No. 1 Lake Park',
    },
    {
        key: '4',
        name: 'Disabled User',
        age: 99,
        address: 'Sidney No. 1 Lake Park',
    },
];

const placeholderColumns: ColumnProps[] = [1, 2, 3].map((key) => ({
    key,
    title: () => <Skeleton.Title style={{ width: '0' }} />,
    render: () => <Skeleton.Paragraph style={{ width: `${50 * key}px` }} rows={1} />,
}));

const placeholderDataSource = [1, 2, 3, 4].map((key) => ({ key }));

export default function SkeletonDemo() {
    const placeholder = (
        <div style={{ position: 'relative' }}>
            <Table style={{ 'background-color': 'var(--semi-color-bg-1)' }} columns={placeholderColumns} dataSource={placeholderDataSource} pagination={false} />
            <div style={{ position: 'absolute', left: '0', right: '0', top: '0', bottom: '0' }} />
        </div>
    );

    return (
        <Skeleton placeholder={placeholder} loading>
            <div>
                <Table columns={columns} dataSource={dataSource} pagination={false} />
            </div>
        </Skeleton>
    );
}
