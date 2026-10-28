import * as dateFns from 'date-fns';
import { Table, Avatar, Input, Button, Space, type ColumnProps } from '@fibrae/semi-ui-solid';

const DAY = 24 * 60 * 60 * 1000;

interface Row {
    key: string;
    name: string;
    owner: string;
    size: number;
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
            name: isSemiDesign ? `Semi Design 设计稿${i}.fig` : `Semi D2C 设计稿${i}.fig`,
            owner: isSemiDesign ? '姜鹏志' : '郝宣',
            size: randomNumber,
            updateTime: new Date(2024, 4, 6, 12).valueOf() + randomNumber * DAY,
            avatarBg: isSemiDesign ? 'grey' : 'red',
        });
    }
    return data;
};

const dataSource = getData();

const figmaIconUrl = '/assets/placeholder/app.svg';

export default function TableDemo() {
    let inputEl: HTMLInputElement | undefined;

    const columns: ColumnProps<Row>[] = [
        {
            title: '标题',
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
            renderFilterDropdown: (props) => {
                const handleChange = (value: string) => {
                    const filteredValue = value ? [value] : [];
                    props.setTempFilteredValue(filteredValue);
                };

                return (
                    <Space vertical align="start" style={{ padding: '8px' }}>
                        <Input inputRef={(el) => (inputEl = el)} value={props.tempFilteredValue[0]} onChange={handleChange} />
                        <Space>
                            <Button onClick={() => props.confirm({ closeDropdown: true })}>筛选 + 关闭</Button>
                            <Button onClick={() => props.clear({ closeDropdown: true })}>清除 + 关闭</Button>
                            <Button onClick={() => props.close()}>直接关闭</Button>
                        </Space>
                    </Space>
                );
            },
            onFilterDropdownVisibleChange: () => {
                inputEl?.focus();
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
                        <Avatar size="small" color={record.avatarBg} style={{ 'margin-right': '4px' }}>
                            {typeof text === 'string' && text.slice(0, 1)}
                        </Avatar>
                        {text}
                    </div>
                );
            },
            onFilter: (value, record) => record.owner.includes(value),
            defaultFilteredValue: ['姜鹏志'],
            renderFilterDropdown: (props) => {
                const handleChange = (value: string) => {
                    if (value) {
                        props.setTempFilteredValue([value]);
                    } else {
                        props.setTempFilteredValue([]);
                    }
                };

                return (
                    <Space vertical align="start" style={{ padding: '8px' }}>
                        <Input value={props.tempFilteredValue[0]} onChange={handleChange} />
                        <Space>
                            <Button onClick={() => props.confirm({ closeDropdown: false })}>筛选后不关闭</Button>
                            <Button onClick={() => props.clear({ closeDropdown: false })}>清除后不关闭</Button>
                            <Button onClick={() => props.close()}>直接关闭</Button>
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
