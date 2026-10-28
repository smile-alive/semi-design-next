import { useMemo, useState } from 'react';
import { debounce } from 'es-toolkit';
import { IconSearch } from '@fibrae/semi-icons-react';
import { IconSelect, IconForm, IconTable, IconInput, IconButton } from '@fibrae/semi-icons-react/lab';
import { AutoComplete, type AutoCompleteDataItem } from '@fibrae/semi-ui-react';

const initList = [
    { value: 'select', label: '选择器', icon: <IconSelect /> },
    { value: 'input', label: '输入框', icon: <IconInput /> },
    { value: 'form', label: '表单', icon: <IconForm /> },
    { value: 'button', label: '按钮', icon: <IconButton /> },
    { value: 'table', label: '表格', icon: <IconTable /> },
];

type ListItem = (typeof initList)[number];

export default function AutoCompleteDemo() {
    const [loading, setLoading] = useState(false);
    const [list, setList] = useState(initList);

    const search = useMemo(
        () =>
            debounce((inputValue: string) => {
                setLoading(true);
                let newList = initList;
                if (inputValue) {
                    newList = initList.filter((item) => item.value.includes(inputValue));
                }
                setTimeout(() => {
                    setList(newList);
                    setLoading(false);
                }, 1000);
            }, 200),
        []
    );

    const handleSelect = (value: string | number | AutoCompleteDataItem) => {
        console.log(value);
    };

    const renderItem = (item: ListItem) => {
        return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ fontSize: 32 }}>{item.icon}</div>
                <div style={{ marginLeft: 12 }}>
                    <p>{item.value}</p>
                    <p>{item.label}</p>
                </div>
            </div>
        );
    };

    const renderSelectedItem = (item: ListItem) => {
        // Unlike Select, this can return only a string, not a ReactNode
        return item.value;
    };

    return <AutoComplete aria-label="搜索" data={list} style={{ width: 250 }} prefix={<IconSearch />} onSearch={search} loading={loading} renderItem={renderItem} renderSelectedItem={renderSelectedItem} onSelect={handleSelect} />;
}
