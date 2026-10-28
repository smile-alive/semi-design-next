<script setup lang="ts">
    import Radio, { RadioGroup } from '../..';
    import Popover from '../../../popover';
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
