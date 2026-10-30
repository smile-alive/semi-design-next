<script lang="ts">
    import { Skeleton, SkeletonParagraph, SkeletonTitle, Table, type ColumnProps } from '@fibrae/semi-ui-svelte';

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

    const placeholderColumns: ColumnProps[] = [1, 2, 3].map((key) => ({ dataIndex: `${key}` }));
    const placeholderDataSource = [1, 2, 3, 4].map((key) => ({ key }));
</script>

<Skeleton loading>
    {#snippet placeholder()}
        <div style="position: relative">
            <Table columns={placeholderColumns} dataSource={placeholderDataSource} pagination={false} style="background-color: var(--semi-color-bg-1)">
                {#snippet headerCell()}
                    <SkeletonTitle style="width: 0" />
                {/snippet}
                {#snippet cell({ column })}
                    <SkeletonParagraph rows={1} style="width: {50 * Number(column.dataIndex)}px" />
                {/snippet}
            </Table>
            <div style="position: absolute; inset: 0"></div>
        </div>
    {/snippet}
    <div>
        <Table {columns} {dataSource} pagination={false} />
    </div>
</Skeleton>
