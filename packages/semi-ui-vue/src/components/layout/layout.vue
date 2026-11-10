<script setup lang="ts">
    import { ref } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/components/layout/constants';
    import '@fibrae/semi-foundation/components/layout/layout.scss';
    import { type ElementProps, semiDefault, semiGlobalDefault } from '../../base/index';
    import { elementType, nativeTag, slotNodes } from '../../utils/index';
    import { provideLayoutContext } from './context';
    import type { LayoutProps, LayoutSlots } from './interface';

    const props = withDefaults(defineProps<LayoutProps & /* @vue-ignore */ ElementProps<'section', keyof LayoutProps>>(), {
        tagName: () => semiDefault('Layout', 'tagName', 'section'),
        hasSider: semiGlobalDefault('Layout', 'hasSider'),
    });

    const slots = defineSlots<LayoutSlots>();

    // registration finds Siders nested deeper than a direct child
    const siderCount = ref(0);

    provideLayoutContext({
        addSider: () => {
            siderCount.value++;
        },
        removeSider: () => {
            siderCount.value--;
        },
    });

    // The direct-child scan also covers SSR and first paint, which registration cannot. Known limit: the default slot
    // runs twice. Upgrade: style the class with `:has(> .semi-layout-sider)` instead.
    const hasSider = () => props.hasSider === true || siderCount.value > 0 || slotNodes(slots.default?.() ?? []).some(([node]) => elementType(node) === 'Layout.Sider');
</script>

<template>
    <component :is="nativeTag(props.tagName)" :class="[cssClasses.PREFIX, { [`${cssClasses.PREFIX}-has-sider`]: hasSider() }]">
        <slot />
    </component>
</template>
