<script setup lang="ts">
    import { ref } from 'vue';
    import { RadioGroup, Space, type RadioChangeEvent, type RadioValue } from '@fibrae/semi-ui-vue';

    const value1 = ref<RadioValue | undefined>('Guest');
    const value2 = ref<RadioValue | undefined>('Developer');
    const value3 = ref<RadioValue | undefined>('Maintainer');
    const plainOptions = ['Guest', 'Developer', 'Maintainer'];
    const options = [
        { label: 'Guest', value: 'Guest', extra: 'Semi Design', style: { width: '120px' } },
        { label: 'Developer', value: 'Developer', extra: 'Semi Design', style: { width: '120px' } },
        { label: 'Maintainer', value: 'Maintainer', extra: 'Semi Design', style: { width: '120px' } },
    ];
    const optionsWithDisabled = [
        { label: 'Guest', value: 'Guest' },
        { label: 'Developer', value: 'Developer' },
        { label: 'Maintainer', value: 'Maintainer', disabled: true },
    ];

    const log = (name: string, e: RadioChangeEvent) => console.log(`${name} checked`, e.target.value);
</script>

<template>
    <Space align="start" spacing="loose" vertical>
        <RadioGroup v-model="value1" aria-label="单选组合示例" name="demo-radio-group-1" :options="plainOptions" @change="log('radio1', $event)" />
        <RadioGroup v-model="value2" aria-label="单选组合示例" name="demo-radio-group-2" :options="optionsWithDisabled" @change="log('radio2', $event)" />
        <RadioGroup v-model="value3" aria-label="单选组合示例" name="demo-radio-group-3" :options="options" @change="log('radio3', $event)" />
    </Space>
</template>
