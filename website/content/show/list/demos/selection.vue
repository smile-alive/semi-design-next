<script setup lang="ts">
    import { computed, ref } from 'vue';
    import { Checkbox, CheckboxGroup, List, Radio, RadioGroup, type CheckboxValue, type RadioValue } from '@fibrae/semi-ui-vue';

    const data = ['围城', '平凡的世界（全三册）', '三体（全集）', '雪中悍刀行（全集）', '撒哈拉的故事', '明朝那些事', '一禅小和尚', '沙丘', '被讨厌的勇气', '罪与罚', '月亮与六便士', '沉默的大多数', '第一人称单数'];
    const pageData = computed(() => data.slice(0, 8));
    const checkboxVal = ref<CheckboxValue[]>([data[0]]);
    const radioVal = ref<RadioValue | undefined>(data[0]);
    const listStyle = { border: '1px solid var(--semi-color-border)', flexBasis: '100%', flexShrink: 0 };
</script>

<template>
    <div :style="{ display: 'flex' }">
        <div :style="{ marginRight: '16px', width: '280px', display: 'flex', flexWrap: 'wrap' }">
            <CheckboxGroup v-model="checkboxVal">
                <List class="component-list-demo-booklist" :dataSource="pageData" size="small" :split="false" :style="listStyle">
                    <template #item="{ item }">
                        <List.Item class="list-item">
                            <Checkbox :value="item">{{ item }}</Checkbox>
                        </List.Item>
                    </template>
                </List>
            </CheckboxGroup>
        </div>
        <div :style="{ marginRight: '16px', width: '280px', display: 'flex', flexWrap: 'wrap' }">
            <RadioGroup v-model="radioVal">
                <List class="component-list-demo-booklist" :dataSource="pageData" size="small" :split="false" :style="listStyle">
                    <template #item="{ item }">
                        <List.Item class="list-item">
                            <Radio :value="item">{{ item }}</Radio>
                        </List.Item>
                    </template>
                </List>
            </RadioGroup>
        </div>
    </div>
</template>
