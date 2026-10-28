<script setup lang="ts">
    import { Spin } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Spin>
            <template #tip>I am loading...</template>
            <div style="border: 1px solid var(--semi-color-primary); border-radius: 4px; padding-left: 8px">
                <p>Here are some texts.</p>
                <p>And more texts on the way.</p>
            </div>
        </Spin>
    </div>
</template>
