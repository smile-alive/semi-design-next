<script setup lang="ts">
    import { Button, Popconfirm, Tooltip } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Popconfirm :style="{ width: '320px' }">
        <span :style="{ display: 'inline-block' }">
            <Tooltip>
                <Button type="danger">删除</Button>
                <template #content>删除评价</template>
            </Tooltip>
        </span>
        <template #title>确认</template>
        <template #content>是否确认删除</template>
    </Popconfirm>
</template>
