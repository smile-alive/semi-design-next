import { IconHandle, IconClose } from '@fibrae/semi-icons-solid';
import { Transfer, Button, Checkbox, Avatar, type TransferDataItem, type TransferRenderSelectedItemProps, type TransferRenderSourceItemProps } from '@fibrae/semi-ui-solid';

function renderSourceItem(item: TransferRenderSourceItemProps) {
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
                    <div class="name">{item.label}</div>
                    <div class="email">{item.value}</div>
                </div>
            </Checkbox>
        </div>
    );
}

function renderSelectedItem(item: TransferRenderSelectedItemProps) {
    // the handle exists only with `draggable`, which this demo sets
    const DragHandle = item.sortableHandle?.(() => <IconHandle class="semi-right-item-drag-handler" />);
    return (
        <div class="components-transfer-demo-selected-item">
            {DragHandle && <DragHandle />}
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
}

function customFilter(searchValue: string, item: TransferDataItem) {
    return String(item.value).includes(searchValue) || String(item.label).includes(searchValue);
}

const data = [
    { label: '夏可漫', value: 'xiakeman@example.com', abbr: '夏', color: 'amber', area: 'US', key: 1 },
    { label: '申悦', value: 'shenyue@example.com', abbr: '申', color: 'indigo', area: 'UK', key: 2 },
    { label: '文嘉茂', value: 'wenjiamao@example.com', abbr: '文', color: 'cyan', area: 'HK', key: 3 },
    { label: '曲晨一', value: 'quchenyi@example.com', abbr: '曲', color: 'blue', area: 'India', key: 4 },
    { label: '曲晨二', value: 'quchener@example.com', abbr: '二', color: 'blue', area: 'India', key: 5 },
    { label: '曲晨三', value: 'quchensan@example.com', abbr: '三', color: 'blue', area: 'India', key: 6 },
];

export default function TransferDemo() {
    return (
        <Transfer
            draggable
            style={{ width: '568px' }}
            dataSource={data}
            filter={customFilter}
            defaultValue={['xiakeman@example.com', 'shenyue@example.com']}
            renderSelectedItem={renderSelectedItem}
            renderSourceItem={renderSourceItem}
            inputProps={{ placeholder: '搜索姓名或邮箱' }}
            onChange={(values, items) => console.log(values, items)}
        />
    );
}
