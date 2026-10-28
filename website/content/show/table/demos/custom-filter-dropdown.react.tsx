import { useState, useRef, type CompositionEvent } from 'react';
import * as dateFns from 'date-fns';
import { IconTickCircle, IconComment, IconClear } from '@fibrae/semi-icons-react';
import { Table, Avatar, Input, Space, Tag, type ColumnProps } from '@fibrae/semi-ui-react';

const DAY = 24 * 60 * 60 * 1000;

const getData = () => {
    const data = [];
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

export default function TableDemo() {
    const [dataSource] = useState(getData);
    const [filteredValue, setFilteredValue] = useState<string[]>([]);
    const compositionRef = useRef({ isComposition: false });

    const figmaIconUrl = '/assets/placeholder/app.svg';

    const handleChange = (value: string) => {
        if (compositionRef.current.isComposition) {
            return;
        }
        const newFilteredValue = value ? [value] : [];
        setFilteredValue(newFilteredValue);
    };
    const handleCompositionStart = () => {
        compositionRef.current.isComposition = true;
    };

    const handleCompositionEnd = (event: CompositionEvent<HTMLInputElement>) => {
        compositionRef.current.isComposition = false;
        const value = (event.target as HTMLInputElement).value;
        const newFilteredValue = value ? [value] : [];
        setFilteredValue(newFilteredValue);
    };

    const columns: ColumnProps[] = [
        {
            title: (
                <Space>
                    <span>标题</span>
                    <Input placeholder="请输入筛选值" style={{ width: 200 }} onCompositionStart={handleCompositionStart} onCompositionEnd={handleCompositionEnd} onChange={handleChange} showClear />
                </Space>
            ),
            dataIndex: 'name',
            width: 400,
            render: (text) => {
                return (
                    <div>
                        <Avatar size="small" shape="square" src={figmaIconUrl} alt="" style={{ marginRight: 12 }} />
                        {text}
                    </div>
                );
            },
            onFilter: (value, record) => record.name.includes(value),
            filteredValue,
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
            render: (text: 'success' | 'pending' | 'wait') => {
                const tagConfig = {
                    success: { color: 'green', prefixIcon: <IconTickCircle />, text: '已交付' },
                    pending: { color: 'pink', prefixIcon: <IconClear />, text: '已延期' },
                    wait: { color: 'cyan', prefixIcon: <IconComment />, text: '待评审' },
                } as const;
                const tagProps = tagConfig[text];
                return (
                    <Tag shape="circle" {...tagProps} style={{ userSelect: 'text' }}>
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
                        <Avatar size="small" color={record.avatarBg} style={{ marginRight: 4 }}>
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
