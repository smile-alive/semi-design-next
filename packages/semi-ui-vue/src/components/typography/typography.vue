<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/components/typography/constants';
    import '@fibrae/semi-foundation/components/typography/typography.scss';
    import type { ElementProps } from '../../base/element-props';
    import { readSemiDefault, useSemiGlobal } from '../../base/semi-default';
    import type { TypographyProps, TypographySlots } from './interface';

    // component may be a function component, so its default is read at render instead of in a default factory.
    const props = withDefaults(defineProps<TypographyProps & /* @vue-ignore */ ElementProps<'article', keyof TypographyProps>>(), { component: undefined });
    defineSlots<TypographySlots>();

    const semi = useSemiGlobal();

    const tag = computed(() => props.component ?? readSemiDefault(semi, 'Typography', 'component', 'article'));
</script>

<template>
    <component :is="tag" :class="cssClasses.PREFIX">
        <slot />
    </component>
</template>
