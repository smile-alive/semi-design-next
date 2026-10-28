<script setup lang="ts">
    import { shallowRef } from 'vue';
    import { IconSearch } from '@fibrae/semi-icons-vue';
    import { Input, List, ListItem } from '@fibrae/semi-ui-vue';

    const data = ['围城', '平凡的世界（全三册）', '三体（全集）', '雪中悍刀行（全集）', '撒哈拉的故事', '明朝那些事', '一禅小和尚', '沙丘', '被讨厌的勇气', '罪与罚'];

    const list = shallowRef(data);

    const onSearch = (keyword?: string) => {
        list.value = keyword ? data.filter((item) => item.includes(keyword)) : data;
    };
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
                <template #header>
                    <Input placeholder="搜索" @change="(value) => !value && onSearch()" @compositionend="(event) => onSearch((event.target as HTMLInputElement).value)">
                        <template #prefix>
                            <IconSearch />
                        </template>
                    </Input>
                </template>
                <template #item="{ item }">
                    <ListItem class="list-item">{{ item }}</ListItem>
                </template>
            </List>
        </div>
    </div>
</template>
