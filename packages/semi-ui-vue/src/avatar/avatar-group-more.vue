<script setup lang="ts">
    import { computed, type VNode } from 'vue';
    import { usePopupLayer } from '../_base/popup-layer';
    import { type AvatarGroupMoreItem, provideAvatarGroupMoreContext } from './context';

    // provide() covers this component's subtree, so the more slot gets its own component scope.
    const props = defineProps<Omit<AvatarGroupMoreItem, 'layer'>>();
    defineSlots<{ default?: () => VNode[] }>();

    const layer = usePopupLayer();

    provideAvatarGroupMoreContext(computed(() => ({ ...props, layer })));
</script>

<template>
    <slot />
</template>
