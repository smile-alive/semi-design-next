<script setup lang="ts">
    import { computed, ref } from 'vue';
    import { List, Pagination } from '@fibrae/semi-ui-vue';

    const data = ['围城', '平凡的世界（全三册）', '三体（全集）', '雪中悍刀行（全集）', '撒哈拉的故事', '明朝那些事', '一禅小和尚', '沙丘', '被讨厌的勇气', '罪与罚', '月亮与六便士', '沉默的大多数'];
    const pageSize = 4;
    const page = ref(1);
    const pageData = computed(() => data.slice((page.value - 1) * pageSize, page.value * pageSize));
</script>

<template>
    <div>
        <div :style="{ marginRight: '16px', width: '280px', display: 'flex', flexWrap: 'wrap' }">
            <List class="component-list-demo-booklist" :dataSource="pageData" size="small" :split="false" :style="{ border: '1px solid var(--semi-color-border)', flexBasis: '100%', flexShrink: 0 }">
                <template #item="{ item }">
                    <List.Item class="list-item">{{ item }}</List.Item>
                </template>
            </List>
            <Pagination v-model:currentPage="page" :pageSize="pageSize" size="small" :style="{ width: '100%', flexBasis: '100%', justifyContent: 'center' }" :total="data.length" />
        </div>
    </div>
</template>
