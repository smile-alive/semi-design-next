<script setup lang="ts">
    import { ref } from 'vue';
    import Avatar from '../../avatar.vue';

    const props = withDefaults(defineProps<{ initialEnabled?: boolean }>(), { initialEnabled: false });
    const emit = defineEmits<{ activate: [event: MouseEvent] }>();
    const enabled = ref(props.initialEnabled);
    const handleClick = (event: MouseEvent) => emit('activate', event);
</script>

<template>
    <button @click="enabled = !enabled">切换点击监听</button>
    <Avatar alt="用户头像" :onClick="enabled ? handleClick : undefined" src="https://example.com/avatar.png" />
</template>
