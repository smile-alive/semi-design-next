<script setup lang="ts">
    import { ref } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/layout/constants';
    import '@fibrae/semi-foundation/layout/layout.scss';
    import type { ElementProps } from '../_base/element-props';
    import elementType from '../_base/element-type';
    import { nativeTag } from '../_base/native-tag';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import slotNodes from '../_base/slot-nodes';
    import { provideLayoutContext } from './context';
    import type { LayoutProps, LayoutSlots } from './interface';

    const props = withDefaults(defineProps<LayoutProps & /* @vue-ignore */ ElementProps<'section', keyof LayoutProps>>(), {
        prefixCls: () => semiDefault('Layout', 'prefixCls', cssClasses.PREFIX),
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
    <component :is="nativeTag(props.tagName)" :class="[props.prefixCls, { [`${props.prefixCls}-has-sider`]: hasSider() }]">
        <slot />
    </component>
</template>
