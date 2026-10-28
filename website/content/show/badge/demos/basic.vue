<script setup lang="ts">
    import { IconLock } from '@fibrae/semi-icons-vue';
    import { Avatar, Badge } from '@fibrae/semi-ui-vue';

    const style = {
        width: '42px',
        height: '42px',
        borderRadius: '4px',
    };
</script>

<template>
    <div>
        <Badge :count="5">
            <Avatar color="blue" shape="square" :style="style">BM</Avatar>
        </Badge>
        <br />
        <br />
        <Badge dot>
            <Avatar color="blue" shape="square" :style="style">YL</Avatar>
        </Badge>
        <br />
        <br />
        <Badge>
            <template #count>
                <IconLock :style="{ color: 'var(--semi-color-primary)' }" />
            </template>
            <Avatar color="light-blue" shape="square" :style="style">XZ</Avatar>
        </Badge>
        <br />
        <br />
        <Badge count="NEW">
            <Avatar color="light-blue" shape="square" :style="style">WF</Avatar>
        </Badge>
    </div>
</template>
