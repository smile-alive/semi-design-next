<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, SideSheet, TextArea } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const value = ref('');
</script>

<template>
    <Button @click="visible = true">Open SideSheet</Button>
    <TextArea v-model="value" placeholder="Please enter something" style="margin-top: 12px" />
    <SideSheet v-model:visible="visible" :disableScroll="false" :mask="false" title="可操作外部的侧边栏">
        <p>这里是输入的内容：</p>
        <p>{{ value }}</p>
    </SideSheet>
</template>
