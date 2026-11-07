<script setup lang="ts">
    import Popover from '@fibrae/semi-ui-vue/popover/index';
    import Radio, { RadioGroup } from '../..';
</script>

<template>
    <Popover :motion="false" trigger="click">
        <RadioGroup aria-label="x">
            <Radio value="A">A</Radio>
            <Radio value="B">B</Radio>
        </RadioGroup>
        <template #content>
            <div>popup</div>
        </template>
    </Popover>
</template>
