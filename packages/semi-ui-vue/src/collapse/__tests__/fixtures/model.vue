<script setup lang="ts">
    import { ref } from 'vue';
    import Collapse from '../..';

    const activeKey = ref<string | string[]>('1');
    const changes = ref(0);
</script>

<template>
    <Collapse v-model:activeKey="activeKey" @change="changes += 1">
        <Collapse.Panel itemKey="1">
            <template #header>one</template>
            content one
        </Collapse.Panel>
        <Collapse.Panel itemKey="2">
            <template #header>two</template>
            content two
        </Collapse.Panel>
    </Collapse>
    <button type="button" @click="activeKey = ['2']">set two</button>
    <output aria-label="model">{{ JSON.stringify(activeKey) }}</output>
    <output aria-label="changes">{{ changes }}</output>
</template>
