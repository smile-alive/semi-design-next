import { Skeleton, Table, type ColumnProps } from '@fibrae/semi-ui-react';

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
    title: <Skeleton.Title style={{ width: '0' }} />,
    dataIndex: `${key}`,
}));

const placeholderDataSource = [1, 2, 3, 4].map((key) => ({
    key,
    1: <Skeleton.Paragraph style={{ width: 50 }} rows={1} />,
    2: <Skeleton.Paragraph style={{ width: 100 }} rows={1} />,
    3: <Skeleton.Paragraph style={{ width: 150 }} rows={1} />,
}));

export default function SkeletonDemo() {
    const placeholder = (
        <div style={{ position: 'relative' }}>
            <Table style={{ backgroundColor: 'var(--semi-color-bg-1)' }} columns={placeholderColumns} dataSource={placeholderDataSource} pagination={false} />
            <div style={{ position: 'absolute', inset: 0 }} />
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
