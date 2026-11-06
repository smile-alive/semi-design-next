import { useState, type ReactNode } from 'react';
import { IconAlarm, IconBookmark, IconCamera, IconDuration, IconEdit, IconFolder } from '@fibrae/semi-icons-react';
import { OverflowList, Tag, Slider } from '@fibrae/semi-ui-react';

interface Item {
    icon: ReactNode;
    key: string;
}

const items: Item[] = [
    { icon: <IconAlarm style={{ marginInlineEnd: 4 }} />, key: 'alarm' },
    { icon: <IconBookmark style={{ marginInlineEnd: 4 }} />, key: 'bookmark' },
    { icon: <IconCamera style={{ marginInlineEnd: 4 }} />, key: 'camera' },
    { icon: <IconDuration style={{ marginInlineEnd: 4 }} />, key: 'duration' },
    { icon: <IconEdit style={{ marginInlineEnd: 4 }} />, key: 'edit' },
    { icon: <IconFolder style={{ marginInlineEnd: 4 }} />, key: 'folder' },
];

const renderOverflow = (overflowItems: Item[]) => {
    return overflowItems.length ? <Tag style={{ flex: '0 0 auto', fontVariantNumeric: 'tabular-nums' }}>+{overflowItems.length}</Tag> : null;
};

const renderItem = (item: Item) => {
    return (
        <Tag color="blue" key={item.key} style={{ marginInlineEnd: 8, flex: '0 0 auto' }}>
            {item.icon}
            {item.key}
        </Tag>
    );
};

export default function OverflowListDemo() {
    const [width, setWidth] = useState(100);

    return (
        <div>
            <Slider aria-label="Container width" step={1} value={width} onChange={(value) => typeof value === 'number' && setWidth(value)} />
            <br />
            <br />
            <div style={{ width: `${width}%` }}>
                <OverflowList items={items} overflowRenderer={renderOverflow} visibleItemRenderer={renderItem} />
            </div>
        </div>
    );
}
