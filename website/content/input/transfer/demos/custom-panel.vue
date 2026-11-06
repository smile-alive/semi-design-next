<script setup lang="ts">
    import { IconSearch } from '@fibrae/semi-icons-vue';
    import { Button, Input, Spin, Transfer, type TransferValue } from '@fibrae/semi-ui-vue';

    const dataSource = Array.from({ length: 100 }, (_v, i) => ({
        label: `海底捞门店 ${i}`,
        value: i,
        disabled: false,
        key: `key-${i}`,
    }));

    const onChange = (values: TransferValue) => console.log(values);
</script>

<template>
    <Transfer class="component-transfer-demo-custom-panel" :dataSource="dataSource" @change="onChange">
        <template #sourcePanel="panel">
            <section class="source-panel">
                <div class="panel-header sp-font">门店列表</div>
                <div class="panel-main">
                    <Input aria-label="搜索门店" showClear :style="{ width: '454px', margin: '12px 14px' }" @change="panel.onSearch">
                        <template #prefix>
                            <IconSearch />
                        </template>
                    </Input>
                    <div class="panel-controls sp-font">
                        <span>待选门店: {{ panel.filterData.length }}</span>
                        <Button size="small" theme="borderless" @click="panel.onAllClick">
                            {{ panel.allChecked ? '取消全选' : '全选' }}
                        </Button>
                    </div>
                    <div class="panel-list">
                        <Spin v-if="panel.loading" />
                        <div v-else-if="panel.noMatch" class="empty sp-font">
                            {{ panel.inputValue ? '无搜索结果' : '暂无内容' }}
                        </div>
                        <template v-else>
                            <div v-for="item in panel.filterData" :key="item.key" class="semi-transfer-item panel-item">
                                <p>{{ item.label }}</p>
                                <Button class="panel-item-remove" size="small" theme="borderless" type="primary" @click="panel.onSelectOrRemove(item)">
                                    {{ panel.selectedItems.has(item.key) ? '删除' : '添加' }}
                                </Button>
                            </div>
                        </template>
                    </div>
                </div>
            </section>
        </template>
        <template #selectedPanel="panel">
            <section class="selected-panel">
                <div class="panel-header sp-font">
                    <div>已选同步门店: {{ panel.selectedData.length }}</div>
                    <Button size="small" theme="borderless" type="primary" @click="panel.onClear">清空</Button>
                </div>
                <div class="panel-main">
                    <div v-if="!panel.selectedData.length" class="empty sp-font">暂无数据，请从左侧筛选</div>
                    <template v-else>
                        <div v-for="item in panel.selectedData" :key="item.key" class="semi-transfer-item panel-item">
                            <p>{{ item.label }}</p>
                            <Button class="panel-item-remove" size="small" theme="borderless" type="primary" @click="panel.onRemove(item)"> 删除 </Button>
                        </div>
                    </template>
                </div>
            </section>
        </template>
    </Transfer>
</template>
