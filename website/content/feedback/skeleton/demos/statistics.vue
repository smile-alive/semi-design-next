<script setup lang="ts">
    import { Descriptions, Skeleton } from '@fibrae/semi-ui-vue';

    const data = [{ key: '实际用户数量', value: '1,480,000' }];
</script>

<template>
    <Skeleton loading>
        <template #placeholder>
            <div>
                <Skeleton.Paragraph :rows="1" :style="{ width: '80px', marginBottom: '10px' }" />
                <Skeleton.Title :style="{ width: '120px' }" />
            </div>
        </template>
        <Descriptions :data="data" row />
    </Skeleton>
</template>
