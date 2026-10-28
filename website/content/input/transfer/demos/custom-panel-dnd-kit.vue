<script setup lang="ts">
    import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import { DragDropManager } from '@dnd-kit/dom';
    import { Sortable, isSortable } from '@dnd-kit/dom/sortable';
    import { IconHandle, IconSearch } from '@fibrae/semi-icons-vue';
    import { Button, Input, Spin, Transfer, type TransferDataItem, type TransferValue } from '@fibrae/semi-ui-vue';

    type SortableId = string | number;

    const dataSource = Array.from({ length: 100 }, (_v, i) => ({
        label: `海底捞门店 ${i}`,
        value: i,
        disabled: false,
        key: `key-${i}`,
    }));

    const values = ref<TransferValue>([2, 4]);

    // Items drag by value, falling back to key
    const sortableId = (item: TransferDataItem): SortableId => item.value ?? item.key;

    const manager = new DragDropManager();
    const sortables = new Map<SortableId, Sortable>();
    const itemElements = new Map<SortableId, HTMLElement>();
    const handleElements = new Map<SortableId, HTMLElement>();

    const bindElement = (elements: Map<SortableId, HTMLElement>, id: SortableId, element: unknown) => {
        if (element instanceof HTMLElement) {
            elements.set(id, element);
        } else {
            elements.delete(id);
        }
    };

    // One Sortable per selected item, synced after the DOM updates when items change
    const syncSortables = () => {
        values.value.forEach((id, index) => {
            const element = itemElements.get(id);
            if (!element) {
                return;
            }
            const sortable = sortables.get(id);
            if (sortable) {
                sortable.index = index;
            } else {
                sortables.set(id, new Sortable({ id, index, element, handle: handleElements.get(id) }, manager));
            }
        });
        for (const [id, sortable] of sortables) {
            if (!values.value.includes(id)) {
                sortable.destroy();
                sortables.delete(id);
            }
        }
    };

    // The selected order is the value array order, so write it back to v-model after a drop
    const stopListening = manager.monitor.addEventListener('dragend', (event) => {
        const { source } = event.operation;
        if (event.canceled || !isSortable(source) || source.initialIndex === source.index) {
            return;
        }
        const next = [...values.value];
        const [moved] = next.splice(source.initialIndex, 1);
        next.splice(source.index, 0, moved);
        values.value = next;
    });

    watch(values, syncSortables, { flush: 'post' });
    onMounted(syncSortables);
    onBeforeUnmount(() => {
        stopListening();
        sortables.forEach((sortable) => sortable.destroy());
        manager.destroy();
    });

    const onChange = (next: TransferValue) => console.log(next);
</script>

<template>
    <Transfer v-model="values" class="component-transfer-demo-custom-panel" :dataSource="dataSource" @change="onChange">
        <template #sourcePanel="{ loading, noMatch, filterData, selectedItems, allChecked, onAllClick, inputValue, onSearch, onSelectOrRemove }">
            <section class="source-panel">
                <div class="panel-header sp-font">门店列表</div>
                <div class="panel-main">
                    <Input aria-label="搜索门店" showClear :style="{ width: '454px', margin: '12px 14px' }" @change="onSearch">
                        <template #prefix>
                            <IconSearch />
                        </template>
                    </Input>
                    <div class="panel-controls sp-font">
                        <span>待选门店: {{ filterData.length }}</span>
                        <Button size="small" theme="borderless" @click="onAllClick">
                            {{ allChecked ? '取消全选' : '全选' }}
                        </Button>
                    </div>
                    <div class="panel-list">
                        <Spin v-if="loading" />
                        <div v-else-if="noMatch" class="empty sp-font">
                            {{ inputValue ? '无搜索结果' : '暂无内容' }}
                        </div>
                        <template v-else>
                            <div v-for="item in filterData" :key="item.key" class="semi-transfer-item panel-item">
                                <div class="panel-item-main" :style="{ flexGrow: 1 }">
                                    <p :style="{ margin: '0 12px' }">{{ item.label }}</p>
                                    <Button class="panel-item-remove" size="small" theme="borderless" type="primary" @click="onSelectOrRemove(item)">
                                        {{ selectedItems.has(item.key) ? '删除' : '添加' }}
                                    </Button>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>
            </section>
        </template>
        <template #selectedPanel="{ selectedData, onClear, onRemove }">
            <section class="selected-panel">
                <div class="panel-header sp-font">
                    <div>已选同步门店: {{ selectedData.length }}</div>
                    <Button size="small" theme="borderless" type="primary" @click="onClear">清空</Button>
                </div>
                <div class="panel-main" :style="{ display: 'block' }">
                    <div :style="{ overflow: 'auto', display: 'flex', flexDirection: 'column', rowGap: '8px' }">
                        <div v-for="item in selectedData" :key="item.key" :ref="(element) => bindElement(itemElements, sortableId(item), element)">
                            <div class="semi-transfer-item panel-item">
                                <!-- Only the handle drags; the Accessibility plugin adds a button role and Tab stop -->
                                <span :ref="(element) => bindElement(handleElements, sortableId(item), element)" :aria-label="String(item.label)" :style="{ lineHeight: 0 }">
                                    <IconHandle class="pane-item-drag-handler" />
                                </span>
                                <div class="panel-item-main" :style="{ flexGrow: 1 }">
                                    <p :style="{ margin: '0 12px' }">{{ item.label }}</p>
                                    <Button class="panel-item-remove" size="small" theme="borderless" type="primary" @click="onRemove(item)"> 删除 </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </template>
    </Transfer>
</template>
