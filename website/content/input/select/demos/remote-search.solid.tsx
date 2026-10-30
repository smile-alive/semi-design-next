import { createSignal } from 'solid-js';
import { debounce } from 'es-toolkit';
import { Select } from '@fibrae/semi-ui-solid';

interface Item {
    value: string;
    label: string;
    type: number;
}

const initialList: Item[] = [
    { value: 'douyin', label: '抖音', type: 1 },
    { value: 'xingtu', label: '醒图', type: 2 },
    { value: 'jianying', label: '剪映', type: 3 },
    { value: 'toutiao', label: '今日头条', type: 4 },
];

function mockSearch(inputValue: string): Item[] {
    const length = Math.ceil(Math.random() * 100);
    return Array.from({ length }, (_, i) => ({ value: inputValue + i, label: `相近业务 ${inputValue}${i}`, type: i + 1 }));
}

export default function SelectDemo() {
    const [loading, setLoading] = createSignal(false);
    const [list, setList] = createSignal(initialList);
    const [value, setValue] = createSignal<Item[]>([]);

    const handleSearch = debounce((inputValue: string) => {
        setLoading(true);
        if (inputValue) {
            const result = mockSearch(inputValue);
            setTimeout(() => {
                setLoading(false);
                setList(result);
            }, 1000);
        } else {
            setLoading(false);
        }
    }, 1000);

    return <Select aria-label="远程搜索" style={{ width: '300px' }} filter remote onChangeWithObject multiple value={value()} onSearch={handleSearch} optionList={list()} loading={loading()} onChange={(v) => setValue(v)} emptyContent={null} />;
}
