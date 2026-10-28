<script setup lang="ts">
    import { ref } from 'vue';
    import { Radio, RadioGroup, Tag, type RadioValue } from '@fibrae/semi-ui-vue';

    const value = ref<RadioValue | undefined>(0);
</script>

<template>
    <div>
        <RadioGroup v-model="value" type="button">
            <Radio :value="1">Show</Radio>
            <Radio :value="0">Hide</Radio>
        </RadioGroup>
        <div :style="{ marginTop: '10px' }">
            <Tag color="light-blue" size="large" :visible="value === 1">Invisible tag</Tag>
        </div>
    </div>
</template>
