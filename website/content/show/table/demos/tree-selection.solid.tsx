import { createSignal } from 'solid-js';
import { union, pull } from 'es-toolkit';
import { Table, type ColumnProps } from '@fibrae/semi-ui-solid';

type TreeRow = {
    key: number;
    dataKey: string;
    name: string;
    type: string;
    description: string;
    default: string;
    children?: TreeRow[];
};
type RowKey = string | number;

function traverse(data: TreeRow[], res: RowKey[]) {
    for (const record of data) {
        res.push(record.key);
        if (Array.isArray(record.children)) {
            traverse(record.children, res);
        }
    }
}

function getAllRowKeys(data: TreeRow[]) {
    const allRowKeys: RowKey[] = [];
    traverse(data, allRowKeys);
    return allRowKeys;
}

function findShouldSelectRowKeys(record: TreeRow, selected: boolean, selectedRowKeys: RowKey[]) {
    const childrenRowKeys: RowKey[] = [];
    if (Array.isArray(record.children)) {
        traverse(record.children, childrenRowKeys);
    }

    if (!selected) {
        return pull([...selectedRowKeys], [record.key, ...childrenRowKeys]);
    }
    return union(selectedRowKeys, [record.key, ...childrenRowKeys]);
}

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

export default function TableDemo() {
    const [selectedRowKeys, setSelectedRowKeys] = createSignal<RowKey[]>([]);

    const doSelect = (record: TreeRow, selected: boolean) => {
        const rowKeys = findShouldSelectRowKeys(record, selected, selectedRowKeys());
        setSelectedRowKeys(rowKeys);
        console.log('select', record, rowKeys);
    };

    const doSelectAll = (selected: boolean) => {
        setSelectedRowKeys(selected ? getAllRowKeys(data) : []);
    };

    return (
        <Table
            columns={columns}
            rowKey="key"
            childrenRecordName="children"
            rowSelection={{
                selectedRowKeys: selectedRowKeys(),
                onSelect: doSelect,
                onSelectAll: doSelectAll,
            }}
            dataSource={data}
            pagination={false}
        />
    );
}
