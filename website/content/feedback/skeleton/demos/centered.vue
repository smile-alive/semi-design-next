<script setup lang="ts">
    import type { StyleValue } from 'vue';
    import { Button, Skeleton } from '@fibrae/semi-ui-vue';

    const style: StyleValue = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '300px',
        marginBottom: '10px',
    };
</script>

<template>
    <Skeleton loading :style="{ textAlign: 'center' }">
        <template #placeholder>
            <div :style="style">
                <Skeleton.Paragraph :rows="3" :style="style" />
                <Skeleton.Button />
            </div>
        </template>
        <div :style="{ textAlign: 'center' }">
            <p>Hi, Bytedance dance dance.</p>
            <p>Hi, Bytedance dance dance.</p>
            <Button>Button</Button>
        </div>
    </Skeleton>
</template>
