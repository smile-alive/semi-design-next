import { useState, type ComponentProps } from 'react';
import { IconArrowUp, IconArrowDown } from '@fibrae/semi-icons-react';
import { Table, Button, type ColumnProps } from '@fibrae/semi-ui-react';

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

const rowKey = 'key';
const childrenRecordName = 'children';

export default function TableDemo() {
    const [expandedRowKeys, setExpandedRowKeys] = useState([1, 2]);
    const [data, setData] = useState(raw);

    const switchRecord = (key1?: number, key2?: number) => {
        const newData = [...data];

        if (key1 != null && key2 != null) {
            const item1 = findRecordByKey(key1, newData);
            const item2 = findRecordByKey(key2, newData);

            const copiedItem1 = { ...item1 };
            const copiedItem2 = { ...item2 };

            coverRecord(item1, copiedItem2);
            coverRecord(item2, copiedItem1);

            setData(newData);
        }
    };

    const findRecordByKey = (key: number, data: TreeRow[]): TreeRow | undefined => {
        if (Array.isArray(data) && data.length && key != null) {
            for (let item of data) {
                if (item[rowKey] === key) {
                    return item;
                }

                const children = item[childrenRecordName];
                if (Array.isArray(children) && children.length) {
                    const item = findRecordByKey(key, children);

                    if (item != null) {
                        return item;
                    }
                }
            }
        }
    };

    const coverRecord = (obj?: Record<string, unknown>, srcObj?: Record<string, unknown>) => {
        if (obj && typeof obj === 'object' && srcObj && typeof srcObj === 'object') {
            const srcKeys = Object.keys(srcObj);
            const copied = { ...srcObj };

            Object.assign(obj, copied);

            Object.keys(obj).forEach((key) => {
                if (!srcKeys.includes(key)) {
                    delete obj[key];
                }
            });
        }

        return obj;
    };

    const getSameLevelRecords = (key?: number, data: TreeRow[] = []): TreeRow[] => {
        if (key != null && Array.isArray(data) && data.length) {
            if (data.find((item) => item[rowKey] === key)) {
                return data;
            }
            for (let item of data) {
                const records = getSameLevelRecords(key, item[childrenRecordName]);

                if (records.length) {
                    return records;
                }
            }
        }
        return [];
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
            render: (record: TreeRow) => {
                const records = getSameLevelRecords(record[rowKey], data);
                const index = records.findIndex((item) => item[rowKey] === record[rowKey]);
                const upProps: ComponentProps<typeof Button> = {};
                const downProps: ComponentProps<typeof Button> = {};

                if (index > 0) {
                    const upRow = records[index - 1];
                    upProps.onClick = () => switchRecord(record[rowKey], upRow[rowKey]);
                } else {
                    upProps.disabled = true;
                }

                if (index < records.length - 1) {
                    const downRow = records[index + 1];
                    downProps.onClick = () => switchRecord(record[rowKey], downRow[rowKey]);
                } else {
                    downProps.disabled = true;
                }

                return (
                    <>
                        <Button aria-label="上移" icon={<IconArrowUp />} {...upProps} />
                        <Button aria-label="下移" icon={<IconArrowDown />} {...downProps} />
                    </>
                );
            },
        },
    ];

    return <Table columns={columns} dataSource={data} rowKey={rowKey} childrenRecordName={childrenRecordName} expandedRowKeys={expandedRowKeys} onExpandedRowsChange={(rows = []) => setExpandedRowKeys(rows.flatMap((item) => ('key' in item && item.key !== undefined ? [item.key] : [])))} />;
}
