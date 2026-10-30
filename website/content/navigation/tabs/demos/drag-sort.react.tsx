import { useState } from 'react';
import { Accessibility } from '@dnd-kit/dom';
import { arrayMove } from '@dnd-kit/helpers';
import { DragDropProvider, type DragEndEvent } from '@dnd-kit/react';
import { isSortable, useSortable } from '@dnd-kit/react/sortable';
import { Tabs, TabPane, type PlainTab, type TabsProps, type TabItemProps } from '@fibrae/semi-ui-react';

// The Provider drops the Accessibility plugin so TabItem keeps role="tab" and roving tabIndex, without aria-pressed
interface SortableTabItemProps extends Pick<TabItemProps, 'selected' | 'size' | 'type' | 'tabPosition' | 'onClick'> {
    item: PlainTab;
    index: number;
}

function SortableTabItem({ item, index, selected, size, type, tabPosition, onClick }: SortableTabItemProps) {
    const { ref, isDragging } = useSortable({
        id: item.itemKey,
        index,
        disabled: item.disabled,
    });
    const style = {
        cursor: item.disabled ? 'not-allowed' : 'grab',
        opacity: isDragging ? 0.5 : 1,
        display: 'inline-flex',
    };
    return <Tabs.TabItem ref={ref} style={style} itemKey={item.itemKey} tab={item.tab} icon={item.icon} disabled={item.disabled} selected={selected} size={size} type={type} tabPosition={tabPosition} onClick={onClick} />;
}

export default function TabsDemo() {
    const [activeKey, setActiveKey] = useState('1');
    const [items, setItems] = useState([
        { itemKey: '1', tab: '文档', content: '文档内容' },
        { itemKey: '2', tab: '表格', content: '表格内容' },
        { itemKey: '3', tab: '幻灯片', content: '幻灯片内容' },
        { itemKey: '4', tab: '表单', content: '表单内容' },
    ]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { source } = event.operation;
        if (!event.canceled && isSortable(source)) {
            setItems((prev) => arrayMove(prev, source.initialIndex, source.index));
        }
    };

    const renderTabBar: TabsProps['renderTabBar'] = ({ type = 'line', size = 'medium', tabPosition = 'top' }) => {
        const barCls = `semi-tabs-bar semi-tabs-bar-${type} semi-tabs-bar-${tabPosition}`;
        return (
            <DragDropProvider plugins={(defaults) => defaults.filter((plugin) => plugin !== Accessibility)} onDragEnd={handleDragEnd}>
                <div className={barCls} role="tablist">
                    {items.map((item, index) => (
                        <SortableTabItem key={item.itemKey} item={item} index={index} selected={activeKey === item.itemKey} size={size} type={type} tabPosition={tabPosition} onClick={(key) => setActiveKey(key)} />
                    ))}
                </div>
            </DragDropProvider>
        );
    };

    return (
        <Tabs type="line" activeKey={activeKey} onChange={setActiveKey} renderTabBar={renderTabBar}>
            {items.map((item) => (
                <TabPane key={item.itemKey} tab={item.tab} itemKey={item.itemKey}>
                    <div style={{ padding: 20 }}>{item.content}</div>
                </TabPane>
            ))}
        </Tabs>
    );
}
