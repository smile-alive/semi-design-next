<script setup lang="ts">
    import Collapse from '../..';

    defineProps<{ show: boolean }>();
</script>

<template>
    <Collapse keepDOM lazyRender>
        <Collapse.Panel itemKey="1">
            <template #header>toggled</template>
            <p v-if="show">body</p>
        </Collapse.Panel>
    </Collapse>
</template>
