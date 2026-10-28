<script setup lang="ts">
    import { Button, Popconfirm, Toast } from '@fibrae/semi-ui-vue';

    const onConfirm = () => {
        Toast.success('确认保存！');
    };

    const onCancel = () => {
        Toast.warning('取消保存！');
    };
</script>

<template>
    <Popconfirm @cancel="onCancel" @confirm="onConfirm">
        <Button>保存</Button>
        <template #title>确定是否要保存此修改？</template>
        <template #content>此修改将不可逆</template>
    </Popconfirm>
</template>
