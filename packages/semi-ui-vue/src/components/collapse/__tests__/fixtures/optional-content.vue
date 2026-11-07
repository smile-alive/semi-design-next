<script setup lang="ts">
    import Collapse from '../..';

    defineProps<{ variant: 'none' | 'comment' }>();
</script>

<template>
    <Collapse defaultActiveKey="1" keepDOM>
        <Collapse.Panel v-if="variant === 'none'" itemKey="1">
            <template #header>empty</template>
        </Collapse.Panel>
        <Collapse.Panel v-else itemKey="1">
            <template #header>empty</template>
            <p v-if="false">hidden</p>
        </Collapse.Panel>
    </Collapse>
</template>
