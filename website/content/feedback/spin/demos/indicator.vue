<script setup lang="ts">
    import { IconLoading } from '@fibrae/semi-icons-vue';
    import { Spin } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div style="margin-inline-start: 30px">
        <div>自定义指示符的加载器</div>
        <Spin>
            <template #indicator>
                <IconLoading />
            </template>
        </Spin>
    </div>
</template>
