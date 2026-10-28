import { createSignal } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { IconAlarm, IconBookmark, IconCamera, IconDuration, IconEdit, IconFolder } from '@fibrae/semi-icons-solid';
import { OverflowList, Slider, Tag } from '@fibrae/semi-ui-solid';

interface Item {
    icon: typeof IconAlarm;
    key: string;
}

const items: Item[] = [
    { icon: IconAlarm, key: 'alarm' },
    { icon: IconBookmark, key: 'bookmark' },
    { icon: IconCamera, key: 'camera' },
    { icon: IconDuration, key: 'duration' },
    { icon: IconEdit, key: 'edit' },
    { icon: IconFolder, key: 'folder' },
];

const renderOverflow = (overflowItems: Item[]) => (overflowItems.length ? <Tag style={{ flex: '0 0 auto', 'font-variant-numeric': 'tabular-nums' }}>+{overflowItems.length}</Tag> : null);

const renderItem = (item: Item) => (
    <Tag color="blue" style={{ 'margin-right': '8px', flex: '0 0 auto' }}>
        <Dynamic component={item.icon} style={{ 'margin-right': '4px' }} />
        {item.key}
    </Tag>
);

export default function OverflowListDemo() {
    const [width, setWidth] = createSignal(100);

    return (
        <div>
            <Slider
                aria-label="Container width"
                step={1}
                value={width()}
                onChange={(value) => {
                    if (typeof value === 'number') setWidth(value);
                }}
            />
            <br />
            <br />
            <div style={{ width: `${width()}%` }}>
                <OverflowList items={items} overflowRenderer={renderOverflow} visibleItemRenderer={renderItem} />
            </div>
        </div>
    );
}
