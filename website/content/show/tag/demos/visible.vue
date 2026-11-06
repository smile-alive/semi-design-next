<script setup lang="ts">
    import { ref } from 'vue';
    import { Radio, RadioGroup, Tag } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const toggleVisible = () => {
        visible.value = !visible.value;
    };
</script>

<template>
    <div>
        <RadioGroup aria-label="标签可见性" :defaultValue="0" type="button" @change="toggleVisible">
            <Radio :value="1">Show</Radio>
            <Radio :value="0">Hide</Radio>
        </RadioGroup>
        <div :style="{ marginTop: '10px' }">
            <Tag color="light-blue" size="large" :visible="visible">Invisible tag</Tag>
        </div>
    </div>
</template>
