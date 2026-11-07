<script setup lang="ts">
    import SideSheet from '../../side-sheet.vue';

    defineProps<{ shown: boolean }>();
    const emit = defineEmits<{ change: [visible: boolean] }>();
</script>

<template>
    <KeepAlive>
        <SideSheet v-if="shown" :motion="false" title="Sheet" visible @afterVisibleChange="emit('change', $event)" />
        <p v-else>other</p>
    </KeepAlive>
</template>
