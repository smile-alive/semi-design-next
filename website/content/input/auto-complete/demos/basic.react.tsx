import { useState } from 'react';
import { IconSearch } from '@fibrae/semi-icons-react';
import { AutoComplete } from '@fibrae/semi-ui-react';

const domains = ['gmail.com', '163.com', 'qq.com'];

export default function AutoCompleteDemo() {
    const [stringData, setStringData] = useState<string[]>([]);
    const [value, setValue] = useState<string | number>('');

    const handleStringSearch = (input: string) => {
        setStringData(input ? domains.map((domain) => `${input}@${domain}`) : []);
    };

    const handleChange = (next: string | number) => {
        console.log('onChange', next);
        setValue(next);
    };

    return <AutoComplete data={stringData} value={value} showClear prefix={<IconSearch />} placeholder="搜索... " onSearch={handleStringSearch} onChange={handleChange} style={{ width: 200 }} />;
}
