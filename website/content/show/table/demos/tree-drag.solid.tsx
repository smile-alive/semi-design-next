import { createSignal } from 'solid-js';
import { IconArrowUp, IconArrowDown } from '@fibrae/semi-icons-solid';
import { Table, Button, type ColumnProps } from '@fibrae/semi-ui-solid';

type TreeRow = {
    key?: number;
    dataKey: string;
    name: string;
    type: string;
    description: string;
    default: string;
    children?: TreeRow[];
};

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

// Swaps two sibling records; returns undefined when the keys are not found, so the caller keeps the old tree
const swapSiblings = (list: TreeRow[], key1: number, key2: number) => {
    const index1 = list.findIndex((item) => item.key === key1);
    const index2 = list.findIndex((item) => item.key === key2);
    if (index1 > -1 && index2 > -1) {
        const next = [...list];
        [next[index1], next[index2]] = [next[index2], next[index1]];
        return next;
    }
    for (let i = 0; i < list.length; i++) {
        const children = list[i].children;
        const swapped = children && swapSiblings(children, key1, key2);
        if (swapped) {
            const next = [...list];
            next[i] = { ...list[i], children: swapped };
            return next;
        }
    }
    return undefined;
};

const getSameLevelRecords = (key: number | undefined, list: TreeRow[]): TreeRow[] => {
    if (key != null) {
        if (list.some((item) => item.key === key)) {
            return list;
        }
        for (const item of list) {
            const records = item.children ? getSameLevelRecords(key, item.children) : [];
            if (records.length) {
                return records;
            }
        }
    }
    return [];
};

export default function TableDemo() {
    const [expandedRowKeys, setExpandedRowKeys] = createSignal<number[]>([1, 2]);
    const [data, setData] = createSignal<TreeRow[]>(raw);

    const switchRecord = (key1: number, key2: number) => {
        const swapped = swapSiblings(data(), key1, key2);
        if (swapped) {
            setData(swapped);
        }
    };

    const siblingKey = (key: number | undefined, offset: number) => {
        const records = getSameLevelRecords(key, data());
        const index = records.findIndex((item) => item.key === key);
        return records[index + offset]?.key;
    };

    const columns: ColumnProps<TreeRow>[] = [
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
            render: (record) => {
                // Read through functions so the buttons follow the tree after a swap
                const upKey = () => siblingKey(record.key, -1);
                const downKey = () => siblingKey(record.key, 1);

                return (
                    <>
                        <Button
                            aria-label="上移"
                            icon={<IconArrowUp />}
                            disabled={upKey() === undefined}
                            onClick={() => {
                                const key = upKey();
                                if (key !== undefined && record.key !== undefined) switchRecord(record.key, key);
                            }}
                        />
                        <Button
                            aria-label="下移"
                            icon={<IconArrowDown />}
                            disabled={downKey() === undefined}
                            onClick={() => {
                                const key = downKey();
                                if (key !== undefined && record.key !== undefined) switchRecord(record.key, key);
                            }}
                        />
                    </>
                );
            },
        },
    ];

    return <Table columns={columns} dataSource={data()} rowKey="key" childrenRecordName="children" expandedRowKeys={expandedRowKeys()} onExpandedRowsChange={(rows = []) => setExpandedRowKeys(rows.flatMap((item) => ('key' in item && item.key !== undefined ? [item.key] : [])))} />;
}
