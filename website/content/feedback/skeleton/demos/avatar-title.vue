<script setup lang="ts">
    import { Avatar, Skeleton } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Skeleton loading>
        <template #placeholder>
            <div :style="{ display: 'flex', alignItems: 'center' }">
                <Skeleton.Avatar :style="{ marginRight: '12px' }" />
                <Skeleton.Title :style="{ width: '120px' }" />
            </div>
        </template>
        <Avatar color="blue" :style="{ marginRight: '12px' }">UI</Avatar>
        <span>Semi UI</span>
    </Skeleton>
</template>
