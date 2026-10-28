import { IconHandle, IconClose } from '@fibrae/semi-icons-react';
import { Transfer, Button, Checkbox, Avatar, type TransferDataItem, type TransferRenderSelectedItemProps, type TransferRenderSourceItemProps } from '@fibrae/semi-ui-react';

export default function TransferDemo() {
    const renderSourceItem = (item: TransferRenderSourceItemProps) => {
        return (
            <div className="components-transfer-demo-source-item" key={item.key}>
                <Checkbox
                    onChange={() => {
                        item.onChange?.();
                    }}
                    checked={item.checked}
                    style={{ height: 52, alignItems: 'center' }}
                >
                    <Avatar color={item.color} size="small">
                        {item.abbr}
                    </Avatar>
                    <div className="info">
                        <div className="name">{item.label}</div>
                        <div className="email">{item.value}</div>
                    </div>
                </Checkbox>
            </div>
        );
    };

    const renderSelectedItem = (item: TransferRenderSelectedItemProps) => {
        const { sortableHandle } = item;
        if (!sortableHandle) {
            return null;
        }
        const DragHandle = sortableHandle(() => <IconHandle className="semi-right-item-drag-handler" />);
        return (
            <div className="components-transfer-demo-selected-item" key={item.key}>
                <DragHandle />
                <Avatar color={item.color} size="small">
                    {item.abbr}
                </Avatar>
                <div className="info">
                    <div className="name">{item.label}</div>
                    <div className="email">{item.value}</div>
                </div>
                <Button className="remove" theme="borderless" type="tertiary" size="small" icon={<IconClose />} aria-label={`移除 ${item.label}`} onClick={item.onRemove} />
            </div>
        );
    };

    const customFilter = (searchValue: string, item: TransferDataItem) => {
        return String(item.value).includes(searchValue) || String(item.label).includes(searchValue);
    };

    const data = [
        { label: '夏可漫', value: 'xiakeman@example.com', abbr: '夏', color: 'amber', area: 'US', key: 1 },
        { label: '申悦', value: 'shenyue@example.com', abbr: '申', color: 'indigo', area: 'UK', key: 2 },
        { label: '文嘉茂', value: 'wenjiamao@example.com', abbr: '文', color: 'cyan', area: 'HK', key: 3 },
        { label: '曲晨一', value: 'quchenyi@example.com', abbr: '曲', color: 'blue', area: 'India', key: 4 },
        { label: '曲晨二', value: 'quchener@example.com', abbr: '二', color: 'blue', area: 'India', key: 5 },
        { label: '曲晨三', value: 'quchensan@example.com', abbr: '三', color: 'blue', area: 'India', key: 6 },
    ];

    return (
        <Transfer
            draggable
            style={{ width: 568 }}
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
