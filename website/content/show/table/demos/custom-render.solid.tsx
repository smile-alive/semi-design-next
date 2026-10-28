import { createSignal } from 'solid-js';
import { IconTickCircle, IconComment, IconClear, IconDelete } from '@fibrae/semi-icons-solid';
import { IllustrationNoResult, IllustrationNoResultDark } from '@fibrae/semi-illustrations-solid';
import { Table, Avatar, Button, Empty, Typography, Tag, type ColumnProps } from '@fibrae/semi-ui-solid';
const { Text } = Typography;

interface Row {
    key: string;
    name: string;
    nameIconSrc: string;
    size: string;
    owner: string;
    status: 'success' | 'pending' | 'wait';
    updateTime: string;
    avatarBg: 'grey' | 'red' | 'light-blue' | 'green';
}

const raw: Row[] = [
    {
        key: '1',
        name: 'Semi Design 设计稿标题可能有点长这时候应该显示 Tooltip.fig',
        nameIconSrc: '/assets/placeholder/app.svg',
        size: '2M',
        owner: '姜鹏志',
        status: 'success',
        updateTime: '2020-02-02 05:13',
        avatarBg: 'grey',
    },
    {
        key: '2',
        name: 'Semi Design 分享演示文稿',
        nameIconSrc: '/assets/docs-icon.png',
        size: '2M',
        owner: '郝宣',
        status: 'pending',
        updateTime: '2020-01-17 05:31',
        avatarBg: 'red',
    },
    {
        key: '3',
        name: '设计文档',
        nameIconSrc: '/assets/docs-icon.png',
        size: '34KB',
        status: 'wait',
        owner: 'Zoey Edwards',
        updateTime: '2020-01-26 11:01',
        avatarBg: 'light-blue',
    },
    {
        key: '4',
        name: 'Semi D2C 设计文档可能也有点长所以也会显示 Tooltip',
        nameIconSrc: '/assets/docs-icon.png',
        size: '34KB',
        status: 'success',
        owner: '姜琪',
        updateTime: '2020-01-26 11:01',
        avatarBg: 'green',
    },
];

export default function TableDemo() {
    const [dataSource, setDataSource] = createSignal<Row[]>(raw);

    const removeRecord = (key: string) => {
        setDataSource((list) => list.filter((item) => item.key !== key));
    };
    const resetData = () => {
        setDataSource([...raw]);
    };

    const columns: ColumnProps<Row>[] = [
        {
            title: '标题',
            dataIndex: 'name',
            width: 400,
            render: (text, record) => {
                return (
                    <span style={{ display: 'flex', 'align-items': 'center' }}>
                        <Avatar size="small" shape="square" src={record.nameIconSrc} alt="" style={{ 'margin-right': '12px' }} />
                        {/* 宽度 = 单元格设定宽度 − 非文本内容宽度 */}
                        <Text ellipsis={{ showTooltip: true }} style={{ width: 'calc(400px - 76px)' }}>
                            {text}
                        </Text>
                    </span>
                );
            },
        },
        {
            title: '大小',
            dataIndex: 'size',
            width: 150,
        },
        {
            title: '交付状态',
            dataIndex: 'status',
            render: (text: Row['status']) => {
                const tagConfig = {
                    // getters create only the icon of the row's status
                    success: {
                        color: 'green',
                        get prefixIcon() {
                            return <IconTickCircle />;
                        },
                        text: '已交付',
                    },
                    pending: {
                        color: 'pink',
                        get prefixIcon() {
                            return <IconClear />;
                        },
                        text: '已延期',
                    },
                    wait: {
                        color: 'cyan',
                        get prefixIcon() {
                            return <IconComment />;
                        },
                        text: '待评审',
                    },
                } as const;
                const tagProps = tagConfig[text];
                return (
                    <Tag shape="circle" {...tagProps} style={{ 'user-select': 'text' }}>
                        {tagProps.text}
                    </Tag>
                );
            },
        },
        {
            title: '所有者',
            dataIndex: 'owner',
            width: 300,
            render: (text, record) => {
                return (
                    <div>
                        <Avatar size="small" color={record.avatarBg} style={{ 'margin-right': '4px' }}>
                            {typeof text === 'string' && text.slice(0, 1)}
                        </Avatar>
                        {text}
                    </div>
                );
            },
        },
        {
            title: '更新日期',
            dataIndex: 'updateTime',
            width: 200,
        },
        {
            title: '',
            dataIndex: 'operate',
            render: (_text, record) => <Button aria-label="删除" icon={<IconDelete />} theme="borderless" onClick={() => removeRecord(record.key)} />,
        },
    ];

    return (
        <>
            <Button onClick={resetData} style={{ 'margin-bottom': '10px' }}>
                重置
            </Button>
            <Table style={{ 'min-height': '350px' }} columns={columns} dataSource={dataSource()} pagination={false} empty={<Empty image={<IllustrationNoResult />} darkModeImage={<IllustrationNoResultDark />} description="搜索无结果" />} />
        </>
    );
}
