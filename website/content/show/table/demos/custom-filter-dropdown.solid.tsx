import { createSignal } from 'solid-js';
import * as dateFns from 'date-fns';
import { IconTickCircle, IconComment, IconClear } from '@fibrae/semi-icons-solid';
import { Table, Avatar, Input, Space, Tag, type ColumnProps } from '@fibrae/semi-ui-solid';

const DAY = 24 * 60 * 60 * 1000;

interface Row {
    key: string;
    name: string;
    owner: string;
    size: number;
    status: 'success' | 'wait';
    updateTime: number;
    avatarBg: 'grey' | 'red';
}

const getData = () => {
    const data: Row[] = [];
    for (let i = 0; i < 46; i++) {
        const isSemiDesign = i % 2 === 0;
        const randomNumber = (i * 1000) % 199;
        data.push({
            key: '' + i,
            name: isSemiDesign ? `Semi Design 设计稿${i}.fig` : `Semi D2C 首页${i}.fig`,
            owner: isSemiDesign ? '姜鹏志' : '郝宣',
            size: randomNumber,
            status: isSemiDesign ? 'success' : 'wait',
            updateTime: new Date('2024-01-25').valueOf() + randomNumber * DAY,
            avatarBg: isSemiDesign ? 'grey' : 'red',
        });
    }
    return data;
};

const dataSource = getData();

const figmaIconUrl = '/assets/placeholder/app.svg';

export default function TableDemo() {
    const [filteredValue, setFilteredValue] = createSignal<string[]>([]);
    // The composition flag is read by event handlers only, so it does not need to be reactive
    let isComposition = false;

    const handleChange = (value: string) => {
        if (isComposition) {
            return;
        }
        const newFilteredValue = value ? [value] : [];
        setFilteredValue(newFilteredValue);
    };
    const handleCompositionStart = () => {
        isComposition = true;
    };

    const handleCompositionEnd = (event: { currentTarget: HTMLInputElement }) => {
        isComposition = false;
        const value = event.currentTarget.value;
        const newFilteredValue = value ? [value] : [];
        setFilteredValue(newFilteredValue);
    };

    const columns: ColumnProps<Row>[] = [
        {
            title: () => (
                <Space>
                    <span>标题</span>
                    <Input placeholder="请输入筛选值" style={{ width: '200px' }} onCompositionStart={handleCompositionStart} onCompositionEnd={handleCompositionEnd} onChange={handleChange} showClear />
                </Space>
            ),
            dataIndex: 'name',
            width: 400,
            render: (text) => {
                return (
                    <div>
                        <Avatar size="small" shape="square" src={figmaIconUrl} alt="" style={{ 'margin-right': '12px' }} />
                        {text}
                    </div>
                );
            },
            onFilter: (value, record) => record.name.includes(value),
            // Read in a getter so the table follows the signal after the columns are created
            get filteredValue() {
                return filteredValue();
            },
        },
        {
            title: '大小',
            dataIndex: 'size',
            sorter: (a, b) => (a.size - b.size > 0 ? 1 : -1),
            render: (text) => `${text} KB`,
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
            sorter: (a, b) => (a.updateTime - b.updateTime > 0 ? 1 : -1),
            render: (value) => {
                return dateFns.format(new Date(value), 'yyyy-MM-dd');
            },
        },
    ];

    return <Table columns={columns} dataSource={dataSource} />;
}
