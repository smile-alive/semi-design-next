<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, SideSheet } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
</script>

<template>
    <Button @click="visible = !visible">Open SideSheet</Button>
    <SideSheet v-model:visible="visible" title="滑动侧边栏">
        <p>This is the content of a basic sidesheet.</p>
        <p>Here is more content...</p>
    </SideSheet>
</template>
