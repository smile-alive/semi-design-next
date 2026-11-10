import type { ComponentProps } from 'react';
import { Table, Tag, Tooltip } from '@fibrae/semi-ui-react';
import type { getData } from './data';

export * from './data';

// any rows: the helpers serve tables whose dataSource infers different row types
type Columns = ComponentProps<typeof Table<any>>['columns'];

export function getColumns() {
    return [
        {
            title: 'Name',
            dataIndex: 'name',
            width: 150,
            fixed: 'left',
        },
        {
            title: 'Age',
            dataIndex: 'age',
            width: 150,
        },
        {
            title: 'Description',
            dataIndex: 'description',
        },
        {
            title: 'Address',
            dataIndex: 'address',
        },
        {
            render: (_text, record) => (
                <Tooltip content={record.description}>
                    <Tag color="green">Show Info</Tag>
                </Tooltip>
            ),
            width: 150,
            fixed: 'right',
        },
    ] satisfies Columns;
}

export function getJSXColumns() {
    const jsxColumns = (
        <>
            <Table.Column title="Name" dataIndex="name" width={150} />
            <Table.Column title="Age" dataIndex="age" width={150} />
            <Table.Column title="Address" dataIndex="address" />
            <Table.Column<ReturnType<typeof getData>[number]>
                render={(_text, record) => (
                    <Tooltip content={record.description}>
                        <Tag color="green">Show Info</Tag>
                    </Tooltip>
                )}
                width={150}
            />
        </>
    );
    return jsxColumns;
}

export function getGroupColumns() {
    return [
        { dataIndex: 'city', title: 'City', width: 400, sorter: (a, b) => (a.city > b.city ? 1 : -1) },
        {
            dataIndex: 'job',
            title: 'Job',
            width: 200,
            filters: [
                { text: 'IOS', value: 'IOS' },
                { text: 'Android', value: 'Android' },
            ],
            onFilter: (value, record) => record.job && record.job.indexOf(value) === 0,
        },
        { dataIndex: 'department', title: 'Department' },
    ] satisfies Columns;
}

export function getNestColumns() {
    return [
        {
            title: 'Base Information',
            fixed: 'left',
            children: [
                {
                    title: 'Name',
                    dataIndex: 'name',
                    fixed: 'left',
                    width: 200,
                    filters: [
                        {
                            text: 'Code 45',
                            value: '45',
                        },
                        {
                            text: 'King 4',
                            value: 'King 4',
                        },
                    ],
                    onFilter: (value, record) => record.name.includes(value),
                },
                {
                    title: 'Age',
                    dataIndex: 'age',
                    fixed: 'left',
                    width: 100,
                    sorter: (a, b) => (a.age - b.age > 0 ? 1 : -1),
                },
            ],
        },
        {
            title: 'Company Information',
            children: [
                {
                    title: 'Company Name',
                    dataIndex: 'company.name',
                },
                {
                    title: 'Company Address',
                    dataIndex: 'company.address',
                },
            ],
        },
        {
            title: 'Address',
            width: 250,
            dataIndex: 'address',
            fixed: 'right',
        },
    ] satisfies Columns;
}
