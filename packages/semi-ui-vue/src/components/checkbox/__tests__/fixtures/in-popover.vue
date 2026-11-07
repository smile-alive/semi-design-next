<script setup lang="ts">
    import { CheckboxGroup } from '../..';
    import Popover from '../../../popover';
</script>

<template>
    <Popover :motion="false" trigger="click">
        <CheckboxGroup aria-label="x" :options="['a']" />
        <template #content>
            <div>popup</div>
        </template>
    </Popover>
</template>
