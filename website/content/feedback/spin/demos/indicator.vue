<script setup lang="ts">
    import { IconLoading } from '@fibrae/semi-icons-vue';
    import { Spin } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div style="margin-left: 30px">
        <div>A spin with customized indicator.</div>
        <Spin>
            <template #indicator>
                <IconLoading />
            </template>
        </Spin>
    </div>
</template>
