import { createSignal } from 'solid-js';
import { IconSearch } from '@fibrae/semi-icons-solid';
import { AutoComplete } from '@fibrae/semi-ui-solid';

const domains = ['gmail.com', '163.com', 'qq.com'];

export default function AutoCompleteDemo() {
    const [stringData, setStringData] = createSignal<string[]>([]);
    const [value, setValue] = createSignal<string | number>('');

    const handleStringSearch = (input: string) => {
        setStringData(input ? domains.map((domain) => `${input}@${domain}`) : []);
    };

    const handleChange = (next: string | number) => {
        console.log('onChange', next);
        setValue(next);
    };

    return <AutoComplete data={stringData()} value={value()} showClear prefix={<IconSearch />} placeholder="搜索... " onSearch={handleStringSearch} onChange={handleChange} style={{ width: '200px' }} />;
}
