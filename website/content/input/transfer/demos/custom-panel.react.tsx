import { type ReactNode } from 'react';
import { IconSearch } from '@fibrae/semi-icons-react';
import { Transfer, Input, Spin, Button, type TransferDataItem, type TransferSelectedPanelProps as SelectedPanelProps, type TransferSourcePanelProps as SourcePanelProps } from '@fibrae/semi-ui-react';

const dataSource = Array.from({ length: 100 }, (_v, i) => ({
    label: `海底捞门店 ${i}`,
    value: i,
    disabled: false,
    key: `key-${i}`,
}));

function renderItem(type: 'source' | 'selected', item: TransferDataItem, onItemAction: (item: TransferDataItem) => void, selectedItems?: SourcePanelProps['selectedItems']) {
    let buttonText = '删除';
    if (type === 'source') {
        buttonText = selectedItems?.has(item.key) ? '删除' : '添加';
    }
    return (
        <div className="semi-transfer-item panel-item" key={item.key}>
            <p>{item.label}</p>
            <Button theme="borderless" type="primary" onClick={() => onItemAction(item)} className="panel-item-remove" size="small">
                {buttonText}
            </Button>
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

function renderSelectedPanel({ selectedData, onClear, onRemove }: SelectedPanelProps) {
    let mainContent: ReactNode = selectedData.map((item) => renderItem('selected', item, onRemove));

    if (!selectedData.length) {
        mainContent = <div className="empty sp-font">暂无数据，请从左侧筛选</div>;
    }

    return (
        <section className="selected-panel">
            <div className="panel-header sp-font">
                <div>已选同步门店: {selectedData.length}</div>
                <Button theme="borderless" type="primary" onClick={onClear} size="small">
                    清空
                </Button>
            </div>
            <div className="panel-main">{mainContent}</div>
        </section>
    );
}

export default function TransferDemo() {
    return <Transfer onChange={(values) => console.log(values)} className="component-transfer-demo-custom-panel" renderSourcePanel={renderSourcePanel} renderSelectedPanel={renderSelectedPanel} dataSource={dataSource} />;
}
