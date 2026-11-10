<script setup lang="ts">
    import { Collapse } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Collapse accordion>
        <Collapse.Panel itemKey="1" :showArrow="false">
            <template #header>This is panel header 1</template>
            <p>Hi, this is the docsite of Semi Design Next.</p>
        </Collapse.Panel>
        <Collapse.Panel itemKey="2">
            <template #header>This is panel header 2</template>
            <p>Hi, this is the docsite of Semi Design Next.</p>
        </Collapse.Panel>
        <Collapse.Panel itemKey="3">
            <template #header>This is panel header 3</template>
            <p>Hi, this is the docsite of Semi Design Next.</p>
        </Collapse.Panel>
    </Collapse>
</template>
