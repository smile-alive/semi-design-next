import { useState, type ReactNode } from 'react';
import { IconAlarm, IconBookmark, IconCamera, IconDuration, IconEdit, IconFolder } from '@fibrae/semi-icons-react';
import { OverflowList, Tag, Slider } from '@fibrae/semi-ui-react';

interface Item {
    icon: ReactNode;
    key: string;
}

export default function OverflowListDemo() {
    const [width, setWidth] = useState(100);
    const renderHiddenCount = (hiddenItems: Item[]) => <Tag style={{ marginRight: 8, marginLeft: 8, flex: '0 0 auto', fontVariantNumeric: 'tabular-nums' }}>+{hiddenItems.length}</Tag>;
    const renderOverflow = ([start, end]: [Item[], Item[]]): [ReactNode, ReactNode] => [renderHiddenCount(start), renderHiddenCount(end)];
    const renderItem = (item: Item) => {
        return (
            <Tag key={item.key} color="blue" style={{ marginRight: 8, flex: '0 0 auto' }}>
                {item.icon}
                {item.key}
            </Tag>
        );
    };

    const items: Item[] = [
        { icon: <IconAlarm style={{ marginRight: 4 }} />, key: 'alarm' },
        { icon: <IconBookmark style={{ marginRight: 4 }} />, key: 'bookmark' },
        { icon: <IconCamera style={{ marginRight: 4 }} />, key: 'camera' },
        { icon: <IconDuration style={{ marginRight: 4 }} />, key: 'duration' },
        { icon: <IconEdit style={{ marginRight: 4 }} />, key: 'edit' },
        { icon: <IconFolder style={{ marginRight: 4 }} />, key: 'folder' },
    ];

    return (
        <div>
            <Slider aria-label="Container width" step={1} value={width} onChange={(value) => typeof value === 'number' && setWidth(value)} />
            <br />
            <br />
            <div style={{ width: `${width}%` }}>
                <OverflowList items={items} renderMode="scroll" overflowRenderer={renderOverflow} visibleItemRenderer={renderItem} />
            </div>
        </div>
    );
}
