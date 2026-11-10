<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/layout/constants';
    import '@fibrae/semi-foundation/components/layout/layout.scss';
    import type { ElementProps } from '../../base/index';
    import { nativeTag } from '../../utils/index';
    import type { LayoutBasicProps, LayoutSlots } from './interface';

    const props = withDefaults(defineProps<LayoutBasicProps & /* @vue-ignore */ ElementProps<'section', keyof LayoutBasicProps>>(), {
        tagName: 'main',
    });

    defineSlots<LayoutSlots>();
</script>

<template>
    <component :is="nativeTag(props.tagName)" :class="`${cssClasses.PREFIX}-content`">
        <slot />
    </component>
</template>
