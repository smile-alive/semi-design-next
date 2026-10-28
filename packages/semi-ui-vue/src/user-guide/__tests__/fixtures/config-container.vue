<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import ConfigProvider from '../../../config-provider/config-provider.vue';
    import type { UserGuideStepItem } from '../../interface';
    import UserGuide from '../../user-guide.vue';

    defineProps<{ steps: UserGuideStepItem[]; mode?: 'popup' | 'modal'; ownContainer?: () => HTMLElement }>();
    const container = useTemplateRef<HTMLDivElement>('container');
</script>

<template>
    <div ref="container" class="config-container" />
    <ConfigProvider :getPopupContainer="() => container as HTMLDivElement">
        <UserGuide :getPopupContainer="ownContainer" :mode="mode" :steps="steps" visible />
    </ConfigProvider>
</template>
