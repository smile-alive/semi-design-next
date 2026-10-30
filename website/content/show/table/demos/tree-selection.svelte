<script lang="ts">
    import { pull, union } from 'es-toolkit';
    import { Table, type ColumnProps, type RowSelectionProps } from '@fibrae/semi-ui-svelte';

    interface TreeRow {
        key: number;
        dataKey: string;
        name: string;
        type: string;
        description: string;
        default: string;
        children?: TreeRow[];
    }

    type RowKey = string | number;

    const childrenRecordName = 'children';
    const rowKey = 'key';

    const columns: ColumnProps[] = [
        {
            title: 'Key',
            dataIndex: 'dataKey',
            key: 'dataKey',
        },
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
            width: 200,
        },
        {
            title: '数据类型',
            dataIndex: 'type',
            key: 'type',
            width: 400,
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: '默认值',
            dataIndex: 'default',
            key: 'default',
            width: 100,
        },
    ];

    const data: TreeRow[] = [
        {
            key: 1,
            dataKey: 'videos_info',
            name: '视频信息',
            type: 'Object 对象',
            description: '视频的元信息',
            default: '无',
            children: [
                {
                    key: 11,
                    dataKey: 'status',
                    name: '视频状态',
                    type: 'Enum <Integer> 枚举',
                    description: '视频的可见、推荐状态',
                    default: '1',
                },
                {
                    key: 12,
                    dataKey: 'vid',
                    name: '视频 ID',
                    type: 'String 字符串',
                    description: '标识视频的唯一 ID',
                    default: '无',
                    children: [
                        {
                            key: 121,
                            dataKey: 'video_url',
                            name: '视频地址',
                            type: 'String 字符串',
                            description: '视频的唯一链接',
                            default: '无',
                        },
                    ],
                },
            ],
        },
        {
            key: 2,
            dataKey: 'text_info',
            name: '文本信息',
            type: 'Object 对象',
            description: '视频的元信息',
            default: '无',
            children: [
                {
                    key: 21,
                    dataKey: 'title',
                    name: '视频标题',
                    type: 'String 字符串',
                    description: '视频的标题',
                    default: '无',
                },
                {
                    key: 22,
                    dataKey: 'video_description',
                    name: '视频描述',
                    type: 'String 字符串',
                    description: '视频的描述',
                    default: '无',
                },
            ],
        },
    ];

    // Collects the keys of the rows and all their descendants.
    const collectKeys = (rows: TreeRow[]): RowKey[] => rows.flatMap((row) => [row.key, ...collectKeys(row.children ?? [])]);

    let selectedRowKeys = $state<RowKey[]>([]);

    // Selecting a row selects its descendants too, and clearing it clears them.
    const doSelect = (record: Record<string, any>, selected: boolean) => {
        const keys = [record.key, ...collectKeys((record as TreeRow).children ?? [])];
        selectedRowKeys = selected ? union(selectedRowKeys, keys) : pull([...selectedRowKeys], keys);
    };

    const doSelectAll = (selected: boolean) => {
        selectedRowKeys = selected ? collectKeys(data) : [];
    };

    const rowSelection = $derived<RowSelectionProps>({
        selectedRowKeys,
        onSelect: doSelect,
        onSelectAll: doSelectAll,
    });
</script>

<Table {childrenRecordName} {columns} dataSource={data} pagination={false} {rowKey} {rowSelection} />
