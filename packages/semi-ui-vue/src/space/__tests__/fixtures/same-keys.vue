<script setup lang="ts">
    import Space from '../../space.vue';
</script>

<template>
    <Space>
        <i v-for="item in 1" :key="`a${item}`" />
        <b v-for="item in 1" :key="`a${item}`" />
    </Space>
</template>
