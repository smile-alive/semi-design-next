<script setup lang="ts">
    import { Button, Popconfirm } from '@fibrae/semi-ui-vue';

    const onConfirm = () =>
        new Promise<void>((resolve) => {
            setTimeout(() => {
                console.log('resolve,close popconfirm');
                resolve();
            }, 2000);
        });

    const onCancel = () =>
        new Promise<void>((_resolve, reject) => {
            setTimeout(() => {
                console.log('reject, popconfirm still exist');
                reject();
            }, 2000);
        });
</script>

<template>
    <Popconfirm @cancel="onCancel" @confirm="onConfirm">
        <Button>保存</Button>
        <template #title>确定是否要保存此修改？</template>
        <template #content>此修改将不可逆</template>
    </Popconfirm>
</template>
