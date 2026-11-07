<script setup lang="ts">
    import Popover from '@fibrae/semi-ui-vue/popover/index';
    import { CheckboxGroup } from '../..';
</script>

<template>
    <Popover :motion="false" trigger="click">
        <CheckboxGroup aria-label="x" :options="['a']" />
        <template #content>
            <div>popup</div>
        </template>
    </Popover>
</template>
