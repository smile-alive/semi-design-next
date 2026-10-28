<script setup lang="ts">
    import { ref } from 'vue';
    import { Avatar, Button, Skeleton, Switch } from '@fibrae/semi-ui-vue';

    const loading = ref(true);
</script>

<template>
    <span :style="{ display: 'flex', alignItems: 'center' }">
        <Switch aria-labelledby="skeleton-basic-toggle" @change="loading = !loading" />
        <span id="skeleton-basic-toggle" :style="{ marginLeft: '10px' }">显示加载内容</span>
    </span>
    <br />
    <Skeleton :loading="loading">
        <template #placeholder>
            <Skeleton.Avatar />
        </template>
        <Avatar color="blue" :style="{ marginBottom: '10px' }">U</Avatar>
    </Skeleton>
    <br />
    <Skeleton :loading="loading" :style="{ width: '200px', height: '150px' }">
        <template #placeholder>
            <Skeleton.Image />
        </template>
        <img alt="avatar" height="150" src="/assets/placeholder/avatar-a.svg" />
    </Skeleton>
    <br />
    <Skeleton :loading="loading" :style="{ width: '80px' }">
        <template #placeholder>
            <Skeleton.Title :style="{ marginBottom: '10px' }" />
        </template>
        <h4 :style="{ marginBottom: 0 }">Semi UI</h4>
    </Skeleton>
    <Skeleton :loading="loading" :style="{ width: '240px' }">
        <template #placeholder>
            <Skeleton.Paragraph :rows="2" />
        </template>
        <p :style="{ width: '240px' }">精心打磨每一个组件的用户体验，从用户的角度考虑每个组件的使用场景。</p>
    </Skeleton>
    <br />
    <Skeleton :loading="loading">
        <template #placeholder>
            <Skeleton.Button />
        </template>
        <Button>Button</Button>
    </Skeleton>
</template>
