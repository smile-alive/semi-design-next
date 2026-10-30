<script lang="ts">
    import { IconSearch } from '@fibrae/semi-icons-svelte';
    import { Button, Input, Spin, Transfer, type TransferValue } from '@fibrae/semi-ui-svelte';

    const dataSource = Array.from({ length: 100 }, (_v, i) => ({
        label: `海底捞门店 ${i}`,
        value: i,
        disabled: false,
        key: `key-${i}`,
    }));

    const onChange = (values: TransferValue) => console.log(values);
</script>

<Transfer class="component-transfer-demo-custom-panel" {dataSource} {onChange}>
    {#snippet sourcePanel({ loading, noMatch, filterData, selectedItems, allChecked, onAllClick, inputValue, onSearch, onSelectOrRemove })}
        <section class="source-panel">
            <div class="panel-header sp-font">门店列表</div>
            <div class="panel-main">
                <Input aria-label="搜索门店" onChange={(value) => onSearch(value)} showClear style="width: 454px; margin: 12px 14px">
                    {#snippet prefix()}<IconSearch />{/snippet}
                </Input>
                <div class="panel-controls sp-font">
                    <span>待选门店: {filterData.length}</span>
                    <Button size="small" theme="borderless" onclick={onAllClick}>
                        {allChecked ? '取消全选' : '全选'}
                    </Button>
                </div>
                <div class="panel-list">
                    {#if loading}
                        <Spin />
                    {:else if noMatch}
                        <div class="empty sp-font">
                            {inputValue ? '无搜索结果' : '暂无内容'}
                        </div>
                    {:else}
                        {#each filterData as item (item.key)}
                            <div class="semi-transfer-item panel-item">
                                <p>{item.label}</p>
                                <Button class="panel-item-remove" size="small" theme="borderless" type="primary" onclick={() => onSelectOrRemove(item)}>
                                    {selectedItems.has(item.key) ? '删除' : '添加'}
                                </Button>
                            </div>
                        {/each}
                    {/if}
                </div>
            </div>
        </section>
    {/snippet}
    {#snippet selectedPanel({ selectedData, onClear, onRemove })}
        <section class="selected-panel">
            <div class="panel-header sp-font">
                <div>已选同步门店: {selectedData.length}</div>
                <Button size="small" theme="borderless" type="primary" onclick={onClear}>清空</Button>
            </div>
            <div class="panel-main">
                {#if !selectedData.length}
                    <div class="empty sp-font">暂无数据，请从左侧筛选</div>
                {:else}
                    {#each selectedData as item (item.key)}
                        <div class="semi-transfer-item panel-item">
                            <p>{item.label}</p>
                            <Button class="panel-item-remove" size="small" theme="borderless" type="primary" onclick={() => onRemove(item)}>删除</Button>
                        </div>
                    {/each}
                {/if}
            </div>
        </section>
    {/snippet}
</Transfer>
