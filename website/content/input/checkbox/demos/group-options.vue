<script setup lang="ts">
    import { CheckboxGroup, type CheckboxValue } from '@fibrae/semi-ui-vue';

    const onChange = (checkedValues: CheckboxValue[]) => console.log('checked = ', checkedValues);

    const plainOptions = ['Semi UI', 'Semi DSM', 'Semi D2C'];

    const optionsWithExtra = [
        {
            extra: '从 Semi Design，到 Any Design 快速定制你的设计系统，并应用在设计稿和代码中',
            label: 'Semi DSM',
            value: 'dsm',
        },
        { extra: '高效的 Design To Code 设计稿转代码', label: 'Semi D2C', value: 'd2c' },
    ];

    const optionsWithDisabled = [
        { label: 'Photography', value: 'Photography' },
        { label: 'Movies', value: 'Movies' },
        { label: 'Running', value: 'Running', disabled: false },
    ];
</script>

<template>
    <div>
        <CheckboxGroup aria-label="CheckboxGroup 示例" :defaultValue="['Semi D2C']" :options="plainOptions" @change="onChange" />
        <br />
        <br />
        <CheckboxGroup aria-label="带 extra 示例" :defaultValue="[]" :options="optionsWithExtra" @change="onChange" />
        <br />
        <br />
        <CheckboxGroup aria-label="Checkbox 示例" :defaultValue="['Photography']" disabled :options="optionsWithDisabled" @change="onChange" />
    </div>
</template>
