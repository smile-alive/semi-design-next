import { useState } from 'react';
import { IconSearch } from '@fibrae/semi-icons-react';
import { AutoComplete, Avatar } from '@fibrae/semi-ui-react';

const list: ListItem[] = [
    { name: '夏可漫', email: 'xiakeman@example.com', abbr: 'XK', color: 'amber' },
    { name: '申悦', email: 'shenyue@example.com', abbr: 'SY', color: 'indigo' },
    { name: '曲晨一', email: 'quchenyi@example.com', abbr: 'CY', color: 'blue' },
    { name: '文嘉茂', email: 'wenjiamao@example.com', abbr: 'JM', color: 'cyan' },
];

interface ListItem {
    name: string;
    email: string;
    abbr: string;
    color: 'amber' | 'indigo' | 'blue' | 'cyan';
    value?: string;
    label?: string;
}

export default function AutoCompleteDemo() {
    const [data, setData] = useState<ListItem[]>([]);

    const handleStringSearch = (value: string) => {
        let result: ListItem[];
        if (value) {
            result = list.map((item) => {
                return { ...item, value: item.name, label: item.email };
            });
        } else {
            result = [];
        }
        setData(result);
    };

    const renderOption = (item: ListItem) => {
        return (
            <>
                <Avatar color={item.color} size="small">
                    {item.abbr}
                </Avatar>
                <div style={{ marginLeft: 4 }}>
                    <div style={{ fontSize: 14, marginLeft: 4 }}>{item.name}</div>
                    <div style={{ marginLeft: 4 }}>{item.email}</div>
                </div>
            </>
        );
    };

    return <AutoComplete aria-label="搜索邮箱" data={data} showClear prefix={<IconSearch />} onSearch={handleStringSearch} renderItem={renderOption} renderSelectedItem={(option) => option.email} style={{ width: 280 }} />;
}
