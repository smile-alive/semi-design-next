<script setup lang="ts">
    import { ref } from 'vue';
    import { List, Pagination } from '@fibrae/semi-ui-vue';

    const data = ['围城', '平凡的世界（全三册）', '三体（全集）', '雪中悍刀行（全集）', '撒哈拉的故事', '明朝那些事', '一禅小和尚', '沙丘', '被讨厌的勇气', '罪与罚', '月亮与六便士', '沉默的大多数'];
    const pageSize = 4;
    const page = ref(1);
    const getData = (current: number) => data.slice((current - 1) * pageSize, current * pageSize);
</script>

<template>
    <div>
        <div :style="{ marginInlineEnd: '16px', width: '280px', display: 'flex', flexWrap: 'wrap' }">
            <List class="component-list-demo-booklist" :dataSource="getData(page)" size="small" :split="false" :style="{ border: '1px solid var(--semi-color-border)', flexBasis: '100%', flexShrink: 0 }">
                <template #item="row">
                    <List.Item class="list-item">{{ row.item }}</List.Item>
                </template>
            </List>
            <Pagination v-model:currentPage="page" :pageSize="pageSize" size="small" :style="{ width: '100%', flexBasis: '100%', justifyContent: 'center' }" :total="data.length" />
        </div>
    </div>
</template>
