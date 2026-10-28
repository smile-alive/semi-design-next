<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/layout/constants';
    import '@fibrae/semi-foundation/layout/layout.scss';
    import type { ElementProps } from '../_base/element-props';
    import { nativeTag } from '../_base/native-tag';
    import type { LayoutBasicProps, LayoutSlots } from './interface';

    const props = withDefaults(defineProps<LayoutBasicProps & /* @vue-ignore */ ElementProps<'section', keyof LayoutBasicProps>>(), {
        prefixCls: cssClasses.PREFIX,
        tagName: 'header',
        type: 'header',
    });

    defineSlots<LayoutSlots>();
</script>

<template>
    <component :is="nativeTag(props.tagName)" :class="`${props.prefixCls}-${props.type}`">
        <slot />
    </component>
</template>
