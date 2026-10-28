<script setup lang="ts">
    import { onBeforeUnmount, onMounted, shallowRef } from 'vue';
    import { List, ListItem } from '@fibrae/semi-ui-vue';

    const list = ['围城', '平凡的世界（全三册）', '三体（全集）', '雪中悍刀行（全集）', '撒哈拉的故事', '明朝那些事', '一禅小和尚', '沙丘', '被讨厌的勇气', '罪与罚'];

    const hoverIndex = shallowRef(-1);

    const changeIndex = (offset: number) => {
        let index = hoverIndex.value + offset;
        if (index < 0) {
            index = list.length - 1;
        }
        if (index >= list.length) {
            index = 0;
        }
        hoverIndex.value = index;
    };

    const onKeydown = (event: KeyboardEvent) => {
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            changeIndex(-1);
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            changeIndex(1);
        }
    };

    onMounted(() => window.addEventListener('keydown', onKeydown));
    onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
    <div>
        <div
            :style="{
                marginRight: '16px',
                width: '280px',
                display: 'flex',
                flexWrap: 'wrap',
                border: '1px solid var(--semi-color-border)',
            }"
        >
            <List class="component-list-demo-booklist" :dataSource="list" size="small" :split="false" :style="{ flexBasis: '100%', flexShrink: 0, borderBottom: '1px solid var(--semi-color-border)' }">
                <template #item="{ item, index }">
                    <ListItem :class="{ 'component-list-demo-booklist-active-item': index === hoverIndex }">
                        {{ item }}
                    </ListItem>
                </template>
            </List>
        </div>
    </div>
</template>
