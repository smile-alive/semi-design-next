<script setup lang="ts">
    import { shallowRef } from 'vue';
    import { IconMinusCircle, IconPlusCircle } from '@fibrae/semi-icons-vue';
    import { Button, List } from '@fibrae/semi-ui-vue';

    const data = ['围城', '平凡的世界（全三册）', '三体（全集）', '雪中悍刀行（全集）', '撒哈拉的故事', '明朝那些事', '一禅小和尚', '沙丘', '被讨厌的勇气', '罪与罚', '月亮与六便士', '沉默的大多数', '第一人称单数'];

    const list = shallowRef(data.slice(0, 8));

    const removeItem = (item: string) => {
        list.value = list.value.filter((book) => book !== item);
    };
    const addItem = () => {
        list.value = list.value.concat(data.slice(list.value.length, list.value.length + 1));
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
                <template #item="{ item }">
                    <li :key="item" class="list-item" :style="{ margin: '4px' }">
                        <Button :aria-label="`删除${item}`" :style="{ marginRight: '4px' }" theme="borderless" type="danger" @click="removeItem(item)">
                            <template #icon>
                                <IconMinusCircle />
                            </template>
                        </Button>
                        {{ item }}
                    </li>
                </template>
            </List>
            <div :style="{ margin: '4px', fontSize: '14px' }">
                <Button aria-label="新增书籍" :style="{ marginRight: '4px', color: 'var(--semi-color-info)' }" theme="borderless" @click="addItem">
                    <template #icon>
                        <IconPlusCircle />
                    </template>
                </Button>
                新增书籍
            </div>
        </div>
    </div>
</template>
