<script setup lang="ts">
    import { Button, Popconfirm, Space } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Space>
        <Popconfirm :okButtonProps="{ autoFocus: true, type: 'danger' }">
            <Button>确认聚焦</Button>
            <template #title>确定是否要保存此修改？</template>
            <template #content>此修改将不可逆</template>
        </Popconfirm>
        <Popconfirm :cancelButtonProps="{ autoFocus: true }">
            <Button>取消聚焦</Button>
            <template #title>确定是否要保存此修改？</template>
            <template #content>此修改将不可逆</template>
        </Popconfirm>
        <Popconfirm>
            <Button>内容聚焦</Button>
            <template #title>确定是否要保存此修改？</template>
            <template #content="{ initialFocusRef }">
                <input :ref="initialFocusRef" placeholder="focus here" />
            </template>
        </Popconfirm>
    </Space>
</template>
