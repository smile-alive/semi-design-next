<script lang="ts">
    import { untrack, type ComponentProps } from 'svelte';
    import { DragDropManager } from '@dnd-kit/dom';
    import { isSortable, OptimisticSortingPlugin, Sortable } from '@dnd-kit/dom/sortable';
    import { DragDropProvider } from '@dnd-kit/svelte';
    import { IconHandle, IconSearch } from '@fibrae/semi-icons-svelte';
    import { Button, Input, Spin, Transfer, type TransferDataItem, type TransferOnSortEnd, type TransferValue } from '@fibrae/semi-ui-svelte';

    type ProviderProps = ComponentProps<typeof DragDropProvider>;

    const dataSource = Array.from({ length: 100 }, (_v, i) => ({
        label: `海底捞门店 ${i}`,
        value: i,
        disabled: false,
        key: `key-${i}`,
    }));

    let value = $state<TransferValue>([2, 4]);
    // The order shown while dragging; cleared on drop, so Transfer's value stays the only truth
    let preview = $state.raw<TransferDataItem[] | null>(null);

    // The default plugins keep the Accessibility one, which gives each handle a button role and Tab stop for keyboard sorting
    const manager = new DragDropManager();
    // OptimisticSortingPlugin moves DOM nodes itself, which collides with Svelte's keyed each; `preview` drives the order instead
    const sortablePlugins: ConstructorParameters<typeof Sortable>[0]['plugins'] = (defaults) => defaults.filter((plugin) => plugin !== OptimisticSortingPlugin);

    // Only the handle drags; it is found inside the row once the row's children are rendered
    const sortable = (id: string | number, position: () => number) => (row: HTMLElement) => {
        const item = new Sortable({ id, index: untrack(position), element: row, handle: row.querySelector<HTMLElement>('[data-sort-handle]') ?? undefined, plugins: sortablePlugins }, manager);
        $effect(() => {
            item.index = position();
        });
        return () => item.destroy();
    };

    const onDragOver = (selectedData: TransferDataItem[]): ProviderProps['onDragOver'] => {
        return ({ operation: { source, target } }) => {
            if (!isSortable(source) || !isSortable(target) || source.id === target.id) return;
            const next = [...(preview ?? selectedData)];
            const from = next.findIndex((item) => item.key === source.id);
            const to = next.findIndex((item) => item.key === target.id);
            if (from < 0 || to < 0) return;
            next.splice(to, 0, ...next.splice(from, 1));
            preview = next;
        };
    };

    const onDragEnd = (selectedData: TransferDataItem[], onSortEnd: TransferOnSortEnd): ProviderProps['onDragEnd'] => {
        return ({ canceled, operation: { source } }) => {
            if (!canceled && preview && source) {
                const oldIndex = selectedData.findIndex((item) => item.key === source.id);
                const newIndex = preview.findIndex((item) => item.key === source.id);
                if (oldIndex !== newIndex) onSortEnd({ oldIndex, newIndex });
            }
            preview = null;
        };
    };

    const onChange = (next: TransferValue) => console.log(next);
</script>

<Transfer bind:value class="component-transfer-demo-custom-panel" {dataSource} {onChange}>
    {#snippet sourcePanel({ loading, noMatch, filterData, selectedItems, allChecked, onAllClick, inputValue, onSearch, onSelectOrRemove })}
        <section class="source-panel">
            <div class="panel-header sp-font">门店列表</div>
            <div class="panel-main">
                <Input aria-label="搜索门店" onChange={(text) => onSearch(text)} showClear style="width: 454px; margin: 12px 14px">
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
                                <div class="panel-item-main" style="flex-grow: 1">
                                    <p style="margin: 0 12px">{item.label}</p>
                                    <Button class="panel-item-remove" size="small" theme="borderless" type="primary" onclick={() => onSelectOrRemove(item)}>
                                        {selectedItems.has(item.key) ? '删除' : '添加'}
                                    </Button>
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
            </div>
        </section>
    {/snippet}
    {#snippet selectedPanel({ selectedData, onClear, onRemove, onSortEnd })}
        {@const ordered = preview ?? selectedData}
        <section class="selected-panel">
            <div class="panel-header sp-font">
                <div>已选同步门店: {selectedData.length}</div>
                <Button size="small" theme="borderless" type="primary" onclick={onClear}>清空</Button>
            </div>
            <div class="panel-main" style="display: block">
                <DragDropProvider {manager} onDragEnd={onDragEnd(selectedData, onSortEnd)} onDragOver={onDragOver(selectedData)}>
                    <div style="overflow: auto; display: flex; flex-direction: column; row-gap: 8px">
                        <!-- Keyed by key: dnd-kit reorders the rows mid-drag, and the keyed each moves them with their data -->
                        {#each ordered as item, position (item.key)}
                            <div {@attach sortable(item.key, () => position)}>
                                <div class="semi-transfer-item panel-item">
                                    <span aria-label={String(item.label)} data-sort-handle style="line-height: 0">
                                        <IconHandle class="pane-item-drag-handler" />
                                    </span>
                                    <div class="panel-item-main" style="flex-grow: 1">
                                        <p style="margin: 0 12px">{item.label}</p>
                                        <Button class="panel-item-remove" size="small" theme="borderless" type="primary" onclick={() => onRemove(item)}>删除</Button>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                </DragDropProvider>
            </div>
        </section>
    {/snippet}
</Transfer>
