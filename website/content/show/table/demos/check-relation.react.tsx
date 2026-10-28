import { useMemo, useState } from 'react';
import { Table, type RowSelectionProps } from '@fibrae/semi-ui-react';

export default function TableDemo() {
    const [selectedRowKeys, setSelectedRowKeys] = useState<(string | number)[]>([]);

    const columns = useMemo(
        () => [
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
                width: 200,
            },
            {
                title: '描述',
                dataIndex: 'description',
                key: 'description',
            },
        ],
        []
    );

    const data = useMemo(
        () => [
            {
                key: '1',
                dataKey: 'videos_info',
                name: '视频信息',
                type: 'Object',
                description: '视频的元信息',
                children: [
                    {
                        key: '1-1',
                        dataKey: 'status',
                        name: '视频状态',
                        type: 'Enum',
                        description: '视频的可见状态',
                    },
                    {
                        key: '1-2',
                        dataKey: 'vid',
                        name: '视频 ID',
                        type: 'String',
                        description: '标识视频的唯一 ID',
                        children: [
                            {
                                key: '1-2-1',
                                dataKey: 'video_url',
                                name: '视频地址',
                                type: 'String',
                                description: '视频的唯一链接',
                            },
                        ],
                    },
                ],
            },
            {
                key: '2',
                dataKey: 'text_info',
                name: '文本信息',
                type: 'Object',
                description: '文本的元信息',
                children: [
                    {
                        key: '2-1',
                        dataKey: 'title',
                        name: '标题',
                        type: 'String',
                        description: '文本标题',
                    },
                    {
                        key: '2-2',
                        dataKey: 'description',
                        name: '描述',
                        type: 'String',
                        description: '文本描述',
                    },
                ],
            },
        ],
        []
    );

    const rowSelection = useMemo(
        (): RowSelectionProps<Record<string, unknown>> => ({
            selectedRowKeys,
            onChange: (selectedRowKeys = []) => {
                setSelectedRowKeys(selectedRowKeys);
            },
            checkRelation: 'related',
        }),
        [selectedRowKeys]
    );

    return <Table columns={columns} dataSource={data} rowSelection={rowSelection} pagination={false} />;
}
