<script setup lang="ts">
    import Space from '../../space.vue';

    const items = [1, 2];
</script>

<template>
    <Space>
        <div>content</div>
        <div v-if="false">hidden</div>
        <div>content</div>
        <template v-for="item in items" :key="item">
            <div>content</div>
        </template>
        <div v-for="item in items" :key="item">content</div>
    </Space>
</template>
