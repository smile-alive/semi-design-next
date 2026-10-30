import { createSignal } from 'solid-js';
import { IconClose } from '@fibrae/semi-icons-solid';
import { Transfer, Button, Checkbox, Avatar, Highlight, type TransferDataItem, type TransferRenderSelectedItemProps, type TransferRenderSourceItemProps } from '@fibrae/semi-ui-solid';

const data = [
    { label: '夏可漫', value: 'xiakeman@example.com', abbr: '夏', color: 'amber', area: 'US', key: 1 },
    { label: '申悦', value: 'shenyue@example.com', abbr: '申', color: 'indigo', area: 'UK', key: 2 },
    { label: '文嘉茂', value: 'wenjiamao@example.com', abbr: '文', color: 'cyan', area: 'HK', key: 3 },
    { label: '曲晨一', value: 'quchenyi@example.com', abbr: '曲', color: 'blue', area: 'India', key: 4 },
    { label: '曲晨二', value: 'quchener@example.com', abbr: '二', color: 'blue', area: 'India', key: 5 },
    { label: '曲晨三', value: 'quchensan@example.com', abbr: '三', color: 'blue', area: 'India', key: 6 },
];

function customFilter(searchValue: string, item: TransferDataItem) {
    return String(item.value).includes(searchValue) || String(item.label).includes(searchValue);
}

export default function TransferDemo() {
    const [searchText, setSearchText] = createSignal('');

    const renderSourceItem = (item: TransferRenderSourceItemProps) => {
        return (
            <div class="components-transfer-demo-source-item">
                <Checkbox
                    onChange={() => {
                        item.onChange?.();
                    }}
                    checked={item.checked}
                    style={{ height: '52px', 'align-items': 'center' }}
                >
                    <Avatar color={item.color} size="small">
                        {item.abbr}
                    </Avatar>
                    <div class="info">
                        <div class="name">
                            <Highlight sourceString={String(item.label)} searchWords={[searchText()]} />
                        </div>
                        <div class="email">
                            <Highlight sourceString={String(item.value)} searchWords={[searchText()]} />
                        </div>
                    </div>
                </Checkbox>
            </div>
        );
    };

    const renderSelectedItem = (item: TransferRenderSelectedItemProps) => {
        return (
            <div class="components-transfer-demo-selected-item">
                <Avatar color={item.color} size="small">
                    {item.abbr}
                </Avatar>
                <div class="info">
                    <div class="name">{item.label}</div>
                    <div class="email">{item.value}</div>
                </div>
                <Button class="remove" theme="borderless" type="tertiary" size="small" icon={<IconClose />} aria-label={`移除 ${String(item.label)}`} onClick={() => item.onRemove?.()} />
            </div>
        );
    };

    return (
        <Transfer
            style={{ width: '568px' }}
            dataSource={data}
            filter={customFilter}
            defaultValue={['xiakeman@example.com', 'shenyue@example.com']}
            renderSelectedItem={renderSelectedItem}
            renderSourceItem={renderSourceItem}
            inputProps={{ placeholder: '搜索姓名或邮箱' }}
            onSearch={(text) => setSearchText(text)}
            onChange={(values, items) => console.log(values, items)}
        />
    );
}
