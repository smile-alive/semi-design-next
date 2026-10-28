import { createSignal, For } from 'solid-js';
import { Accessibility } from '@dnd-kit/dom';
import { arrayMove } from '@dnd-kit/helpers';
import { DragDropProvider } from '@dnd-kit/solid';
import { isSortable, useSortable } from '@dnd-kit/solid/sortable';
import { Tabs, TabPane, type PlainTab, type TabsProps, type TabItemProps } from '@fibrae/semi-ui-solid';

// The Provider drops the Accessibility plugin so TabItem keeps role="tab" and roving tabIndex, without aria-pressed
interface SortableTabItemProps extends Pick<TabItemProps, 'selected' | 'size' | 'type' | 'tabPosition' | 'onClick'> {
    item: PlainTab;
    index: number;
}

function SortableTabItem(props: SortableTabItemProps) {
    const { ref, isDragging } = useSortable({
        get id() {
            return props.item.itemKey;
        },
        get index() {
            return props.index;
        },
        get disabled() {
            return props.item.disabled;
        },
    });

    return (
        <Tabs.TabItem
            ref={(node) => ref(node)}
            style={{ cursor: props.item.disabled ? 'not-allowed' : 'grab', opacity: isDragging() ? 0.5 : 1, display: 'inline-flex' }}
            itemKey={props.item.itemKey}
            tab={props.item.tab}
            disabled={props.item.disabled}
            selected={props.selected}
            size={props.size}
            type={props.type}
            tabPosition={props.tabPosition}
            onClick={props.onClick}
        />
    );
}

export default function TabsDemo() {
    const [activeKey, setActiveKey] = createSignal('1');
    const [items, setItems] = createSignal([
        { itemKey: '1', tab: '文档', content: '文档内容' },
        { itemKey: '2', tab: '表格', content: '表格内容' },
        { itemKey: '3', tab: '幻灯片', content: '幻灯片内容' },
        { itemKey: '4', tab: '表单', content: '表单内容' },
    ]);

    const renderTabBar: TabsProps['renderTabBar'] = (tabBarProps) => (
        <DragDropProvider
            plugins={(defaults) => defaults.filter((plugin) => plugin !== Accessibility)}
            onDragEnd={(event) => {
                const { source } = event.operation;
                if (!event.canceled && isSortable(source)) {
                    setItems((prev) => arrayMove(prev, source.initialIndex, source.index));
                }
            }}
        >
            <div class={`semi-tabs-bar semi-tabs-bar-${tabBarProps.type} semi-tabs-bar-${tabBarProps.tabPosition}`} role="tablist">
                <For each={items()}>{(item, index) => <SortableTabItem item={item} index={index()} selected={activeKey() === item.itemKey} size={tabBarProps.size} type={tabBarProps.type} tabPosition={tabBarProps.tabPosition} onClick={(key) => setActiveKey(key)} />}</For>
            </div>
        </DragDropProvider>
    );

    return (
        <Tabs type="line" activeKey={activeKey()} onChange={setActiveKey} renderTabBar={renderTabBar}>
            <For each={items()}>
                {(item) => (
                    <TabPane tab={item.tab} itemKey={item.itemKey}>
                        <div style={{ padding: '20px' }}>{item.content}</div>
                    </TabPane>
                )}
            </For>
        </Tabs>
    );
}
