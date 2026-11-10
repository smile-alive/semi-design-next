<script setup lang="ts">
    import { ref } from 'vue';
    import { Select, TagInput } from '@fibrae/semi-ui-vue';

    const valList = ref(['video', 'camera']);
    const inputVal = ref('');
    const list = [
        { value: 'video', label: '短视频' },
        { value: 'camera', label: '相机' },
        { value: 'editing', label: '剪辑' },
        { value: 'news', label: '资讯' },
    ];

    const handleSort = (currentLabels: string[]) => {
        valList.value = currentLabels.flatMap((item) => list.find((i) => i.label === item)?.value ?? []);
    };
</script>

<template>
    <h4>可对已选项拖拽重新排序的 Select</h4>
    <Select v-model="valList" aria-label="可拖拽排序的 Select" filter multiple :optionList="list" :style="{ width: '240px' }">
        <template #trigger="selectState">
            <div role="presentation" @keydown.stop>
                <TagInput
                    :allowDuplicates="false"
                    draggable
                    :inputValue="inputVal"
                    :modelValue="selectState.value.map((item) => String(item.label))"
                    showClear
                    @change="handleSort"
                    @inputChange="
                        (word) => {
                            selectState.onSearch(word);
                            inputVal = word;
                        }
                    "
                />
            </div>
        </template>
    </Select>
</template>
