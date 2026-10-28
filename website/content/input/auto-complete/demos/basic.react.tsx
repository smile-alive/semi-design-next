import { useState } from 'react';
import { IconSearch } from '@fibrae/semi-icons-react';
import { AutoComplete } from '@fibrae/semi-ui-react';

export default function AutoCompleteDemo() {
    const [stringData, setStringData] = useState<string[]>([]);
    const [value, setValue] = useState<string | number>('');
    const handleStringSearch = (value: string) => {
        let result: string[];
        if (value) {
            result = ['gmail.com', '163.com', 'qq.com'].map((domain) => `${value}@${domain}`);
        } else {
            result = [];
        }
        setStringData(result);
    };

    const handleChange = (value: string | number) => {
        console.log('onChange', value);
        setValue(value);
    };
    return <AutoComplete data={stringData} value={value} showClear prefix={<IconSearch />} placeholder="搜索... " onSearch={handleStringSearch} onChange={handleChange} style={{ width: 200 }} />;
}
