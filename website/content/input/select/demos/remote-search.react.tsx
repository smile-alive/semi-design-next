import { useMemo, useState } from 'react';
import { debounce } from 'es-toolkit';
import { Select } from '@fibrae/semi-ui-react';

interface Item {
    value: string;
    label: string;
    type: number;
}

function mockSearch(inputValue: string) {
    const length = Math.ceil(Math.random() * 100);
    return Array.from({ length }, (_v, i) => {
        return { value: inputValue + i, label: `相近业务 ${inputValue}${i}`, type: i + 1 };
    });
}

export default function SelectDemo() {
    const [loading, setLoading] = useState(false);
    const optionList: Item[] = [
        { value: 'douyin', label: '抖音', type: 1 },
        { value: 'xingtu', label: '醒图', type: 2 },
        { value: 'jianying', label: '剪映', type: 3 },
        { value: 'toutiao', label: '今日头条', type: 4 },
    ];
    const [list, setList] = useState(optionList);
    const [value, setValue] = useState<Item[]>([]);

    const handleMultipleChange = (newValue: Item[]) => {
        setValue(newValue);
    };

    const handleSearch = useMemo(
        () =>
            debounce((inputValue: string) => {
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
            }, 1000),
        []
    );

    return <Select aria-label="远程搜索" style={{ width: 300 }} filter remote onChangeWithObject multiple value={value} onSearch={handleSearch} optionList={list} loading={loading} onChange={handleMultipleChange} emptyContent={null} />;
}
