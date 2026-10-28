<script setup lang="ts">
    import { ref } from 'vue';
    import { Select, TagInput } from '@fibrae/semi-ui-vue';

    const valList = ref(['douyin', 'ulikecam']);
    const inputVal = ref('');
    const list = [
        { value: 'douyin', label: '抖音' },
        { value: 'ulikecam', label: '轻颜相机' },
        { value: 'jianying', label: '剪映' },
        { value: 'toutiao', label: '今日头条' },
    ];

    const handleSort = (currentLabels: string[]) => {
        valList.value = currentLabels.flatMap((item) => list.find((i) => i.label === item)?.value ?? []);
    };
</script>

<template>
    <h4>可对已选项拖拽重新排序的 Select</h4>
    <Select v-model="valList" aria-label="可拖拽排序的 Select" filter multiple :optionList="list" :style="{ width: '240px' }">
        <template #trigger="{ value, onSearch }">
            <div role="presentation" @keydown.stop>
                <TagInput
                    :allowDuplicates="false"
                    draggable
                    :inputValue="inputVal"
                    :modelValue="value.map((item) => String(item.label))"
                    showClear
                    @change="handleSort"
                    @inputChange="
                        (word) => {
                            onSearch(word);
                            inputVal = word;
                        }
                    "
                />
            </div>
        </template>
    </Select>
</template>
