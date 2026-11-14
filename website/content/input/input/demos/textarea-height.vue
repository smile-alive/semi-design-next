<script setup lang="ts">
    import { TextArea } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <TextArea placeholder="高度 120px" :styles="{ textarea: { height: '120px' } }" />
        <br />
        <br />
        <TextArea placeholder="高度 200px，灰色背景" :styles="{ textarea: { height: '200px', backgroundColor: '#f9f9f9' } }" />
        <br />
        <br />
        <TextArea placeholder="style 控制外层容器，styles.textarea 控制 textarea" style="border: 2px solid var(--semi-color-primary)" :styles="{ textarea: { height: '150px' } }" />
    </div>
</template>
