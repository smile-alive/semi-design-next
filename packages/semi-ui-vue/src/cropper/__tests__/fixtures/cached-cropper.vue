<script setup lang="ts">
    import { ref } from 'vue';
    import Cropper from '../../cropper.vue';

    defineProps<{ preview: () => HTMLElement }>();
    const active = ref(true);
</script>

<template>
    <button @click="active = !active">toggle</button>
    <KeepAlive>
        <Cropper v-if="active" :preview="preview" src="https://example.com/a.png" />
    </KeepAlive>
</template>
