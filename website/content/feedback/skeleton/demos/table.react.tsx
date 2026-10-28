import type { ReactNode } from 'react';
import { Skeleton, Table, type ColumnProps } from '@fibrae/semi-ui-react';

export default function SkeletonDemo() {
    const data = {
        columns: [
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
        ],
        content: [
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
        ],
    };

    const skData = {
        columns: [1, 2, 3].map((key) => {
            const item: ColumnProps = {};
            item.title = <Skeleton.Title style={{ width: '0' }} />;
            item.dataIndex = `${key}`;
            return item;
        }),
        dataSource: [1, 2, 3, 4].map((key) => {
            const item: Record<string, ReactNode> = {};
            item.key = key;
            [1, 2, 3].forEach((i) => {
                const width = 50 * i;
                item[i] = <Skeleton.Paragraph style={{ width: width }} rows={1} />;
            });
            return item;
        }),
    };

    const placeholder = (
        <div style={{ position: 'relative' }}>
            <Table style={{ backgroundColor: 'var(--semi-color-bg-1)' }} columns={skData.columns} dataSource={skData.dataSource} pagination={false} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        </div>
    );

    return (
        <Skeleton placeholder={placeholder} loading>
            <div>
                <Table columns={data.columns} dataSource={data.content} pagination={false} />
            </div>
        </Skeleton>
    );
}
