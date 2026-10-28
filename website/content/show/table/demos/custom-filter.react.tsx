import { useState, useRef } from 'react';
import * as dateFns from 'date-fns';
import { Table, Avatar, Input, Button, Space, type InputHandle, type ColumnProps } from '@fibrae/semi-ui-react';

const DAY = 24 * 60 * 60 * 1000;

const getData = () => {
    const data = [];
    for (let i = 0; i < 46; i++) {
        const isSemiDesign = i % 2 === 0;
        const randomNumber = (i * 1000) % 199;
        data.push({
            key: '' + i,
            name: isSemiDesign ? `Semi Design 设计稿${i}.fig` : `Semi D2C 设计稿${i}.fig`,
            owner: isSemiDesign ? '姜鹏志' : '郝宣',
            size: randomNumber,
            updateTime: new Date(2019, 6, 23, 12).valueOf() + randomNumber * DAY,
            avatarBg: isSemiDesign ? 'grey' : 'red',
        });
    }
    return data;
};

export default function TableDemo() {
    const [dataSource] = useState(getData);
    const inputRef = useRef<InputHandle>(null);

    const figmaIconUrl = '/assets/placeholder/app.svg';

    const columns: ColumnProps[] = [
        {
            title: '标题',
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
            renderFilterDropdown: (props) => {
                const { tempFilteredValue, setTempFilteredValue, confirm, clear, close } = props;

                const handleChange = (value: string) => {
                    const filteredValue = value ? [value] : [];
                    setTempFilteredValue(filteredValue);
                };

                return (
                    <Space vertical align="start" style={{ padding: 8 }}>
                        <Input ref={inputRef} value={tempFilteredValue[0]} onChange={handleChange} />
                        <Space>
                            <Button onClick={() => confirm({ closeDropdown: true })}>筛选 + 关闭</Button>
                            <Button onClick={() => clear({ closeDropdown: true })}>清除 + 关闭</Button>
                            <Button onClick={() => close()}>直接关闭</Button>
                        </Space>
                    </Space>
                );
            },
            onFilterDropdownVisibleChange: () => {
                if (inputRef.current && inputRef.current.focus) {
                    inputRef.current.focus();
                }
            },
        },
        {
            title: '大小',
            dataIndex: 'size',
            sorter: (a, b) => (a.size - b.size > 0 ? 1 : -1),
            render: (text) => `${text} KB`,
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
            onFilter: (value, record) => record.owner.includes(value),
            defaultFilteredValue: ['姜鹏志'],
            renderFilterDropdown: (props) => {
                const { tempFilteredValue, setTempFilteredValue, confirm, clear, close } = props;

                const handleChange = (value: string) => {
                    if (value) {
                        setTempFilteredValue([value]);
                    } else {
                        setTempFilteredValue([]);
                    }
                };

                return (
                    <Space vertical align="start" style={{ padding: 8 }}>
                        <Input value={tempFilteredValue[0]} onChange={handleChange} />
                        <Space>
                            <Button onClick={() => confirm({ closeDropdown: false })}>筛选后不关闭</Button>
                            <Button onClick={() => clear({ closeDropdown: false })}>清除后不关闭</Button>
                            <Button onClick={() => close()}>直接关闭</Button>
                        </Space>
                    </Space>
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
