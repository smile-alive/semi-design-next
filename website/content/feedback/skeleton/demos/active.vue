<script setup lang="ts">
    import { Avatar, Skeleton } from '@fibrae/semi-ui-vue';

    const style = {
        display: 'flex',
        alignItems: 'flex-start',
    };
</script>

<template>
    <Skeleton active loading>
        <template #placeholder>
            <div :style="style">
                <Skeleton.Avatar :style="{ marginRight: '12px' }" />
                <div>
                    <Skeleton.Title :style="{ width: '120px', marginBottom: '12px', marginTop: '12px' }" />
                    <Skeleton.Paragraph :rows="3" :style="{ width: '240px' }" />
                </div>
            </div>
        </template>
        <div :style="style">
            <Avatar color="blue" :style="{ marginRight: '12px' }">UI</Avatar>
            <div>
                <h3>Semi UI</h3>
                <p>Hi, Bytedance dance dance.</p>
                <p>Hi, Bytedance dance dance.</p>
                <p>Hi, Bytedance dance dance.</p>
            </div>
        </div>
    </Skeleton>
</template>
