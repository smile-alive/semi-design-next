<script setup lang="ts">
    import Button from '@fibrae/semi-ui-vue/button/index';
    import Popconfirm from '../../popconfirm.vue';

    const props = defineProps<{ okAutoFocus?: boolean }>();
</script>

<template>
    <Popconfirm :okButtonProps="props.okAutoFocus ? { autoFocus: true } : undefined">
        <Button>内容聚焦</Button>
        <template #title>确定是否要保存此修改？</template>
        <template #content="{ initialFocusRef }">
            <input :ref="initialFocusRef" placeholder="focus here" />
        </template>
    </Popconfirm>
</template>
