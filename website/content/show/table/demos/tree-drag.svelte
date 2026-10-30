<script lang="ts">
    import { IconArrowDown, IconArrowUp } from '@fibrae/semi-icons-svelte';
    import { Button, Table, type ColumnProps } from '@fibrae/semi-ui-svelte';

    interface TreeRow {
        key?: number;
        dataKey: string;
        name: string;
        type: string;
        description: string;
        default: string;
        children?: TreeRow[];
    }

    const raw: TreeRow[] = [
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

    const rowKey = 'key';
    const childrenRecordName = 'children';

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
        {
            key: 'operation',
        },
    ];

    let expandedRowKeys = $state<(string | number)[]>([1, 2]);
    let data = $state.raw(raw);

    const getSameLevelRecords = (key: number | undefined, rows: TreeRow[]): TreeRow[] => {
        if (key == null) {
            return [];
        }
        if (rows.some((item) => item[rowKey] === key)) {
            return rows;
        }
        for (const item of rows) {
            const records = getSameLevelRecords(key, item[childrenRecordName] ?? []);
            if (records.length) {
                return records;
            }
        }
        return [];
    };

    // Returns a copy of the tree in which the record swaps places with its sibling `offset` rows away.
    const moveRecord = (rows: TreeRow[], key: number | undefined, offset: -1 | 1): TreeRow[] => {
        const index = rows.findIndex((item) => item[rowKey] === key);
        if (index === -1) {
            return rows.map((item) => (item[childrenRecordName] ? { ...item, children: moveRecord(item[childrenRecordName], key, offset) } : item));
        }
        const next = [...rows];
        [next[index], next[index + offset]] = [next[index + offset], next[index]];
        return next;
    };

    const canMove = (record: TreeRow, offset: -1 | 1) => {
        const records = getSameLevelRecords(record[rowKey], data);
        const index = records.findIndex((item) => item[rowKey] === record[rowKey]);
        return index >= 0 && index + offset >= 0 && index + offset < records.length;
    };

    const move = (record: TreeRow, offset: -1 | 1) => {
        data = moveRecord(data, record[rowKey], offset);
    };
</script>

<Table bind:expandedRowKeys {childrenRecordName} {columns} dataSource={data} {rowKey}>
    {#snippet cell({ column, record, text })}
        {#if column.key === 'operation'}
            <Button aria-label="上移" disabled={!canMove(record as TreeRow, -1)} onclick={() => move(record as TreeRow, -1)}>
                {#snippet icon()}
                    <IconArrowUp />
                {/snippet}
            </Button>
            <Button aria-label="下移" disabled={!canMove(record as TreeRow, 1)} onclick={() => move(record as TreeRow, 1)}>
                {#snippet icon()}
                    <IconArrowDown />
                {/snippet}
            </Button>
        {:else}
            {text}
        {/if}
    {/snippet}
</Table>
