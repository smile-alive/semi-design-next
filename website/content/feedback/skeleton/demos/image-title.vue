<script setup lang="ts">
    import { Skeleton } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Skeleton loading>
        <template #placeholder>
            <div>
                <Skeleton.Image :style="{ width: '200px', height: '150px' }" />
                <Skeleton.Title :style="{ width: '120px', marginTop: '10px' }" />
            </div>
        </template>
        <img alt="avatar" height="150" src="/assets/placeholder/avatar-a.svg" />
        <h4>Semi UI</h4>
    </Skeleton>
</template>
