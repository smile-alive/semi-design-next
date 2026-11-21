<script setup lang="ts">
    import { useId } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
    import { joinIds } from '@fibrae/semi-foundation/utils';
    import '@fibrae/semi-foundation/components/form/form.scss';
    import type { ElementProps } from '../../base/index';
    import { hasSlotContent } from '../../utils/index';
    import type { FormSectionProps, FormSectionSlots } from './interface';

    defineOptions({ inheritAttrs: false });
    const props = defineProps<FormSectionProps & /* @vue-ignore */ ElementProps<'fieldset', keyof FormSectionProps>>();
    defineSlots<FormSectionSlots>();

    const extraId = useId();

    const prefix = cssClasses.PREFIX;
</script>

<template>
    <fieldset v-bind="$attrs" :aria-describedby="joinIds($attrs['aria-describedby'], hasSlotContent($slots.extraText) && extraId)" :class="`${prefix}-section`">
        <!-- an empty legend would still draw its divider -->
        <legend v-if="hasSlotContent($slots.text)" :class="[`${prefix}-section-text`, props.classNames?.title]" :style="props.styles?.title">
            <slot name="text" />
        </legend>
        <div v-if="hasSlotContent($slots.extraText)" :id="extraId" :class="[`${prefix}-section-extra`, props.classNames?.extra]" :style="props.styles?.extra">
            <slot name="extraText" />
        </div>
        <slot />
    </fieldset>
</template>
