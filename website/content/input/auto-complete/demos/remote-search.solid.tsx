import { createSignal } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { debounce } from 'es-toolkit';
import { IconSearch } from '@fibrae/semi-icons-solid';
import { IconButton, IconForm, IconInput, IconSelect, IconTable } from '@fibrae/semi-icons-solid/lab';
import { AutoComplete, type AutoCompleteDataItem } from '@fibrae/semi-ui-solid';

// Icons are stored as components so each row mounts its own instance
const initList = [
    { value: 'select', label: '选择器', icon: IconSelect },
    { value: 'input', label: '输入框', icon: IconInput },
    { value: 'form', label: '表单', icon: IconForm },
    { value: 'button', label: '按钮', icon: IconButton },
    { value: 'table', label: '表格', icon: IconTable },
];

type ListItem = (typeof initList)[number];

export default function AutoCompleteDemo() {
    const [loading, setLoading] = createSignal(false);
    const [list, setList] = createSignal<ListItem[]>(initList);

    const handleSearch = (inputValue: string) => {
        setLoading(true);
        const newList = inputValue ? initList.filter((item) => item.value.includes(inputValue)) : initList;
        setTimeout(() => {
            setList(newList);
            setLoading(false);
        }, 1000);
    };

    const search = debounce(handleSearch, 200);

    const handleSelect = (value: string | number | AutoCompleteDataItem) => {
        console.log(value);
    };

    const renderItem = (item: ListItem) => (
        <div style={{ display: 'flex', 'align-items': 'center' }}>
            <div style={{ 'font-size': '32px' }}>
                <Dynamic component={item.icon} />
            </div>
            <div style={{ 'margin-left': '12px' }}>
                <p>{item.value}</p>
                <p>{item.label}</p>
            </div>
        </div>
    );

    // Unlike Select, this can return only a string, not a JSX element
    const renderSelectedItem = (item: ListItem) => item.value;

    return <AutoComplete aria-label="搜索" data={list()} style={{ width: '250px' }} prefix={<IconSearch />} onSearch={search} loading={loading()} renderItem={renderItem} renderSelectedItem={renderSelectedItem} onSelect={handleSelect} />;
}
