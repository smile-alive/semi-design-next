import { For, Show } from 'solid-js';
import { DragDropProvider, type DragDropProviderProps } from '@dnd-kit/solid';
import { isSortable, useSortable } from '@dnd-kit/solid/sortable';
import { IconSearch, IconHandle } from '@fibrae/semi-icons-solid';
import { Transfer, Input, Spin, Button, type TransferDataItem, type TransferOnSortEnd as OnSortEnd, type TransferSelectedPanelProps as SelectedPanelProps, type TransferSourcePanelProps as SourcePanelProps } from '@fibrae/semi-ui-solid';

interface SortableItemProps {
    id: string | number;
    index: number;
    items: TransferDataItem[];
    onRemove: (item: TransferDataItem) => void;
}

// Only the handle drags; the Accessibility plugin gives it a button role and Tab stop for keyboard sorting
function SortableItem(props: SortableItemProps) {
    const { ref, handleRef } = useSortable({
        get id() {
            return props.id;
        },
        get index() {
            return props.index;
        },
    });

    // the rows are keyed by id, so a new selectedData array re-reads the item instead of remounting the row mid-drag
    const item = () => props.items.find((entry) => entry.key === props.id);

    return (
        <div ref={(node) => ref(node)}>
            <Show keyed when={item()}>
                {(current) => (
                    <div class="semi-transfer-item panel-item">
                        <span ref={(node) => handleRef(node)} aria-label={String(current.label)} style={{ 'line-height': '0' }}>
                            <IconHandle class="pane-item-drag-handler" />
                        </span>
                        <div class="panel-item-main" style={{ 'flex-grow': '1' }}>
                            <p style={{ margin: '0 12px' }}>{current.label}</p>
                            <Button theme="borderless" type="primary" onClick={() => props.onRemove(current)} class="panel-item-remove" size="small">
                                删除
                            </Button>
                        </div>
                    </div>
                )}
            </Show>
        </div>
    );
}

function SortableList(props: { items: TransferDataItem[]; onSortEnd: OnSortEnd; onRemove: (item: TransferDataItem) => void }) {
    const onDragEnd: DragDropProviderProps['onDragEnd'] = (event) => {
        const { source } = event.operation;
        if (!event.canceled && isSortable(source) && source.initialIndex !== source.index) {
            props.onSortEnd({ oldIndex: source.initialIndex, newIndex: source.index });
        }
    };

    return (
        <DragDropProvider onDragEnd={onDragEnd}>
            <div style={{ overflow: 'auto', display: 'flex', 'flex-direction': 'column', 'row-gap': '8px' }}>
                <For each={props.items.map((item) => item.key)}>{(id, index) => <SortableItem id={id} index={index()} items={props.items} onRemove={props.onRemove} />}</For>
            </div>
        </DragDropProvider>
    );
}

const dataSource = Array.from({ length: 100 }, (_, i) => ({
    label: `海底捞门店 ${i}`,
    value: i,
    disabled: false,
    key: `key-${i}`,
}));

// the panels read their live objects in the JSX, as in the plain custom panel demo
function renderSourcePanel(panel: SourcePanelProps) {
    return (
        <section class="source-panel">
            <div class="panel-header sp-font">门店列表</div>
            <div class="panel-main">
                <Input aria-label="搜索门店" style={{ width: '454px', margin: '12px 14px' }} prefix={<IconSearch />} onChange={(value) => panel.onSearch(value)} showClear />
                <div class="panel-controls sp-font">
                    <span>待选门店: {panel.filterData.length}</span>
                    <Button onClick={() => panel.onAllClick()} theme="borderless" size="small">
                        {panel.allChecked ? '取消全选' : '全选'}
                    </Button>
                </div>
                <div class="panel-list">
                    <Show when={!panel.loading} fallback={<Spin />}>
                        <Show when={!panel.noMatch} fallback={<div class="empty sp-font">{panel.inputValue ? '无搜索结果' : '暂无内容'}</div>}>
                            <For each={panel.filterData}>
                                {(item) => (
                                    <div class="semi-transfer-item panel-item">
                                        <div class="panel-item-main" style={{ 'flex-grow': '1' }}>
                                            <p style={{ margin: '0 12px' }}>{item.label}</p>
                                            <Button theme="borderless" type="primary" onClick={() => panel.onSelectOrRemove(item)} class="panel-item-remove" size="small">
                                                {panel.selectedItems.has(item.key) ? '删除' : '添加'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </For>
                        </Show>
                    </Show>
                </div>
            </div>
        </section>
    );
}

function renderSelectedPanel(panel: SelectedPanelProps) {
    return (
        <section class="selected-panel">
            <div class="panel-header sp-font">
                <div>已选同步门店: {panel.length}</div>
                <Button theme="borderless" type="primary" onClick={() => panel.onClear()} size="small">
                    清空
                </Button>
            </div>
            <div class="panel-main" style={{ display: 'block' }}>
                <SortableList items={panel.selectedData} onSortEnd={panel.onSortEnd} onRemove={panel.onRemove} />
            </div>
        </section>
    );
}

export default function TransferDemo() {
    return <Transfer defaultValue={[2, 4]} onChange={(values) => console.log(values)} class="component-transfer-demo-custom-panel" renderSourcePanel={renderSourcePanel} renderSelectedPanel={renderSelectedPanel} dataSource={dataSource} />;
}
