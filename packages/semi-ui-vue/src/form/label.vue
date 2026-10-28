<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/form/constants';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import '@fibrae/semi-foundation/form/form.scss';
    import type { ElementProps } from '../_base/element-props';
    import useLocale from '../locale/use-locale';
    import type { LabelProps, LabelSlots } from './interface';

    const props = withDefaults(defineProps<LabelProps & /* @vue-ignore */ ElementProps<'label', keyof LabelProps>>(), {
        align: 'left',
        disabled: undefined,
        required: false,
        optional: false,
    });

    const slots = defineSlots<LabelSlots>();

    const locale = useLocale('Form');

    const prefix = `${cssClasses.PREFIX}-field-label`;

    const hasExtra = () => Boolean(slots.extra) || (props.extra !== undefined && props.extra !== '');
</script>

<template>
    <label
        :class="[prefix, { [`${prefix}-left`]: props.align === 'left', [`${prefix}-right`]: props.align === 'right', [`${prefix}-required`]: props.required && !props.optional, [`${prefix}-disabled`]: props.disabled, [`${prefix}-with-extra`]: hasExtra() }]"
        :for="props.name || undefined"
        :style="props.width === undefined ? undefined : { width: toCssLength(props.width) }"
    >
        <div :class="`${prefix}-text`" x-semi-prop="label">
            <slot>{{ props.text }}</slot>
            <span v-if="props.optional" :class="`${prefix}-optional-text`">{{ locale.locale.optional }}</span>
        </div>
        <div v-if="hasExtra()" :class="`${prefix}-extra`">
            <slot name="extra">{{ props.extra }}</slot>
        </div>
    </label>
</template>
