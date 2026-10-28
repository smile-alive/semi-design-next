<script setup lang="ts">
    import Button from '../../../button';
    import Popconfirm from '../../popconfirm.vue';

    defineProps<{ okAutoFocus?: boolean }>();
</script>

<template>
    <Popconfirm :okButtonProps="okAutoFocus ? { autoFocus: true } : undefined">
        <Button>内容聚焦</Button>
        <template #title>确定是否要保存此修改？</template>
        <template #content="{ initialFocusRef }">
            <input :ref="initialFocusRef" placeholder="focus here" />
        </template>
    </Popconfirm>
</template>
