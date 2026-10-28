<script setup lang="ts">
    import { IconBolt } from '@fibrae/semi-icons-vue';
    import { Upload } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Upload accept="application/pdf,.jpeg" action="https://api.semi.design/upload" draggable style="margin-top: 10px">
        <template #dragIcon>
            <IconBolt />
        </template>
        <div class="components-upload-demo-drag-area">
            <img alt="demo img" height="96" src="/assets/placeholder/avatar-a.svg" style="border-radius: 4px" />
            <div style="font-size: 14px; margin-top: 8px; flex-basis: 100%; text-align: center; color: var(--semi-color-tertiary)">Wow, you can really dance.</div>
        </div>
    </Upload>
</template>
