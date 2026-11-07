<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import ConfigProvider from '../../../config-provider/config-provider.vue';
    import SideSheet from '../../side-sheet.vue';

    defineProps<{ ownContainer?: () => HTMLElement }>();
    const container = useTemplateRef<HTMLDivElement>('container');
</script>

<template>
    <div ref="container" class="config-container" />
    <ConfigProvider :getPopupContainer="() => container as HTMLDivElement">
        <SideSheet :getPopupContainer="ownContainer" :motion="false" title="Sheet" visible />
    </ConfigProvider>
</template>
