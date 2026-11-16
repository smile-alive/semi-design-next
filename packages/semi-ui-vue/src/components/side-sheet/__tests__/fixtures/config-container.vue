<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import ConfigProvider from '@fibrae/semi-ui-vue/config-provider/config-provider.vue';
    import SideSheet from '../../side-sheet.vue';

    const props = defineProps<{ ownContainer?: () => HTMLElement }>();
    const container = useTemplateRef<HTMLDivElement>('container');
</script>

<template>
    <div ref="container" class="config-container" />
    <ConfigProvider :getPopupContainer="() => container!">
        <SideSheet :getPopupContainer="props.ownContainer" :motion="false" title="Sheet" visible />
    </ConfigProvider>
</template>
