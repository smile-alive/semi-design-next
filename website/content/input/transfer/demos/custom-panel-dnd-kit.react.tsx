import type { ReactNode } from 'react';
import { DragDropProvider, type DragEndEvent } from '@dnd-kit/react';
import { isSortable, useSortable } from '@dnd-kit/react/sortable';
import { IconSearch, IconHandle } from '@fibrae/semi-icons-react';
import { Transfer, Input, Spin, Button, type TransferDataItem, type TransferOnSortEnd as OnSortEnd, type TransferSelectedPanelProps as SelectedPanelProps, type TransferSourcePanelProps as SourcePanelProps } from '@fibrae/semi-ui-react';

type HandleRef = (element: Element | null) => void;
type RenderSortableItem = (props: { id: string | number; handleRef: HandleRef }) => ReactNode;

interface SortableListProps {
    items: Array<string | number>;
    onSortEnd: OnSortEnd;
    renderItem: RenderSortableItem;
}

function SortableList({ items, onSortEnd, renderItem }: SortableListProps) {
    const onDragEnd = (event: DragEndEvent) => {
        const { source } = event.operation;
        if (!event.canceled && isSortable(source) && source.initialIndex !== source.index) {
            onSortEnd({ oldIndex: source.initialIndex, newIndex: source.index });
        }
    };

    return (
        <DragDropProvider onDragEnd={onDragEnd}>
            <div style={{ overflow: 'auto', display: 'flex', flexDirection: 'column', rowGap: '8px' }}>
                {items.map((value, index) => (
                    <SortableItem key={value} id={value} index={index} renderItem={renderItem} />
                ))}
            </div>
        </DragDropProvider>
    );
}

interface SortableItemProps {
    id: string | number;
    index: number;
    renderItem: RenderSortableItem;
}

function SortableItem({ id, index, renderItem }: SortableItemProps) {
    // Only the handle drags; the Accessibility plugin gives it a button role and Tab stop for keyboard sorting
    const { ref, handleRef } = useSortable({ id, index });

    return <div ref={ref}>{renderItem({ id, handleRef })}</div>;
}

const dataSource = Array.from({ length: 100 }, (_v, i) => ({
    label: `海底捞门店 ${i}`,
    value: i,
    disabled: false,
    key: `key-${i}`,
}));

function renderItem(type: 'source' | 'selected', item: TransferDataItem, onItemAction: (item: TransferDataItem) => void, selectedItems?: SourcePanelProps['selectedItems'], handleRef?: HandleRef) {
    let buttonText = '删除';

    if (type === 'source') {
        let checked = selectedItems?.has(item.key);
        buttonText = checked ? '删除' : '添加';
    }

    return (
        <div className="semi-transfer-item panel-item" key={item.key}>
            {handleRef && (
                <span ref={handleRef} aria-label={String(item.label)} style={{ lineHeight: 0 }}>
                    <IconHandle className="pane-item-drag-handler" />
                </span>
            )}
            <div className="panel-item-main" style={{ flexGrow: 1 }}>
                <p style={{ margin: '0 12px' }}>{item.label}</p>
                <Button theme="borderless" type="primary" onClick={() => onItemAction(item)} className="panel-item-remove" size="small">
                    {buttonText}
                </Button>
            </div>
        </div>
    );
}

function renderSourcePanel({ loading, noMatch, filterData, selectedItems, allChecked, onAllClick, inputValue, onSearch, onSelectOrRemove }: SourcePanelProps) {
    let content: ReactNode;
    if (loading) {
        content = <Spin />;
    } else if (noMatch) {
        content = <div className="empty sp-font">{inputValue ? '无搜索结果' : '暂无内容'}</div>;
    } else {
        content = filterData.map((item) => renderItem('source', item, onSelectOrRemove, selectedItems));
    }
    return (
        <section className="source-panel">
            <div className="panel-header sp-font">门店列表</div>
            <div className="panel-main">
                <Input aria-label="搜索门店" style={{ width: 454, margin: '12px 14px' }} prefix={<IconSearch />} onChange={onSearch} showClear />
                <div className="panel-controls sp-font">
                    <span>待选门店: {filterData.length}</span>
                    <Button onClick={onAllClick} theme="borderless" size="small">
                        {allChecked ? '取消全选' : '全选'}
                    </Button>
                </div>
                <div className="panel-list">{content}</div>
            </div>
        </section>
    );
}

function renderSelectedPanel({ selectedData, onClear, onRemove, onSortEnd }: SelectedPanelProps) {
    const renderSelectItem: RenderSortableItem = ({ id, handleRef }) => {
        const item = selectedData.find((item) => id === item.key);
        return item ? renderItem('selected', item, onRemove, undefined, handleRef) : null;
    };

    const sortData = selectedData.map((item) => item.key);

    const mainContent = (
        <div className="panel-main" style={{ display: 'block' }}>
            <SortableList onSortEnd={onSortEnd} items={sortData} renderItem={renderSelectItem} />
        </div>
    );

    return (
        <section className="selected-panel">
            <div className="panel-header sp-font">
                <div>已选同步门店: {selectedData.length}</div>
                <Button theme="borderless" type="primary" onClick={onClear} size="small">
                    清空
                </Button>
            </div>
            {mainContent}
        </section>
    );
}

export default function TransferDemo() {
    return <Transfer defaultValue={[2, 4]} onChange={(values) => console.log(values)} className="component-transfer-demo-custom-panel" renderSourcePanel={renderSourcePanel} renderSelectedPanel={renderSelectedPanel} dataSource={dataSource} />;
}
