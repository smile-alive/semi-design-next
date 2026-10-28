import { For, Show } from 'solid-js';
import { IconSearch } from '@fibrae/semi-icons-solid';
import { Transfer, Input, Spin, Button, type TransferSelectedPanelProps as SelectedPanelProps, type TransferSourcePanelProps as SourcePanelProps } from '@fibrae/semi-ui-solid';

const dataSource = Array.from({ length: 100 }, (_, i) => ({
    label: `海底捞门店 ${i}`,
    value: i,
    disabled: false,
    key: `key-${i}`,
}));

// the panels read their live objects in the JSX: the lists follow the state without a second render call
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
                                        <p>{item.label}</p>
                                        <Button theme="borderless" type="primary" onClick={() => panel.onSelectOrRemove(item)} class="panel-item-remove" size="small">
                                            {panel.selectedItems.has(item.key) ? '删除' : '添加'}
                                        </Button>
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
            <div class="panel-main">
                <Show when={panel.length > 0} fallback={<div class="empty sp-font">暂无数据，请从左侧筛选</div>}>
                    <For each={panel.selectedData}>
                        {(item) => (
                            <div class="semi-transfer-item panel-item">
                                <p>{item.label}</p>
                                <Button theme="borderless" type="primary" onClick={() => panel.onRemove(item)} class="panel-item-remove" size="small">
                                    删除
                                </Button>
                            </div>
                        )}
                    </For>
                </Show>
            </div>
        </section>
    );
}

export default function TransferDemo() {
    return <Transfer onChange={(values) => console.log(values)} class="component-transfer-demo-custom-panel" renderSourcePanel={renderSourcePanel} renderSelectedPanel={renderSelectedPanel} dataSource={dataSource} />;
}
