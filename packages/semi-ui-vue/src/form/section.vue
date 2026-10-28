<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/form/constants';
    import '@fibrae/semi-foundation/form/form.scss';
    import type { ElementProps } from '../_base/element-props';
    import { hasSlotContent } from '../_base/slot-nodes';
    import type { FormSectionSlots } from './interface';

    defineProps</* @vue-ignore */ ElementProps<'section'>>();
    defineSlots<FormSectionSlots>();

    const prefix = cssClasses.PREFIX;
</script>

<template>
    <section :class="`${prefix}-section`">
        <!-- an empty heading would still be announced as one -->
        <h5 v-if="hasSlotContent($slots.text)" :class="`${prefix}-section-text`">
            <slot name="text" />
        </h5>
        <slot />
    </section>
</template>
