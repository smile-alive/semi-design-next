<script setup lang="ts">
    import { ref } from 'vue';
    import { Select, TextArea } from '@fibrae/semi-ui-vue';

    interface Item {
        value: string;
        label: string;
        type: number;
    }

    const list: Item[] = [
        { value: 'douyin', label: '抖音', type: 1 },
        { value: 'ulikecam', label: '轻颜相机', type: 2 },
        { value: 'jianying', label: '剪映', type: 3 },
        { value: 'toutiao', label: '今日头条', type: 4 },
    ];
    const cbValue = ref<Item>();
    const multipleCbValue = ref<Item[]>();
    // Select infers its value type from the value, not from optionList, so an empty typed default gives change Item[]
    const noItems: Item[] = [];

    const onChange = (value?: Item) => {
        cbValue.value = value;
        console.log(value);
    };

    const onMultipleChange = (value: Item[]) => {
        multipleCbValue.value = value;
        console.log(value);
    };
</script>

<template>
    <div>
        <div>
            <Select aria-label="单选" changeWithObject :defaultValue="list[0]" :optionList="list" placeholder="单选" style="width: 150px" @change="onChange" />
            <h4 id="select-on-change-with-object-single">onChange回调:</h4>
            <TextArea aria-labelledby="select-on-change-with-object-single" autosize :modelValue="JSON.stringify(cbValue)" :rows="2" style="width: 320px; margin-bottom: 48px" />
        </div>
        <div>
            <Select aria-label="多选" changeWithObject :defaultValue="noItems" multiple :optionList="list" placeholder="多选" style="width: 320px" @change="onMultipleChange" />
            <h4 id="select-on-change-with-object-multiple">onChange回调:</h4>
            <TextArea aria-labelledby="select-on-change-with-object-multiple" autosize :modelValue="JSON.stringify(multipleCbValue)" style="width: 320px" />
        </div>
    </div>
</template>
