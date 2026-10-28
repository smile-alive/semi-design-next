<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import SideSheet from '../../side-sheet.vue';

    defineProps<{ visible?: boolean }>();
    const container = useTemplateRef<HTMLDivElement>('container');
</script>

<template>
    <div ref="container" class="sidesheet-container">
        <SideSheet :getPopupContainer="() => container as HTMLDivElement" :motion="false" :visible="visible" />
    </div>
</template>
