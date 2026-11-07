<script setup lang="ts">
    import Space from '../../space.vue';
    import Stateful from './stateful.vue';

    defineProps<{ show: boolean }>();
    const emit = defineEmits<{ childMounted: [] }>();
</script>

<template>
    <Space>
        <span v-if="show">cond</span>
        <Stateful @mounted="emit('childMounted')" />
    </Space>
</template>
