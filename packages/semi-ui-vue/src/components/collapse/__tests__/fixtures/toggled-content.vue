<script setup lang="ts">
    import Collapse from '../..';

    const props = defineProps<{ show: boolean }>();
</script>

<template>
    <Collapse keepDOM lazyRender>
        <Collapse.Panel itemKey="1">
            <template #header>toggled</template>
            <p v-if="props.show">body</p>
        </Collapse.Panel>
    </Collapse>
</template>
