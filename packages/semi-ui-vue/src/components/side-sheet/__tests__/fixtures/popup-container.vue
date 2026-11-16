<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import SideSheet from '../../side-sheet.vue';

    const props = defineProps<{ visible?: boolean }>();
    const container = useTemplateRef<HTMLDivElement>('container');
</script>

<template>
    <div ref="container" class="sidesheet-container">
        <SideSheet :getPopupContainer="() => container!" :motion="false" :visible="props.visible" />
    </div>
</template>
