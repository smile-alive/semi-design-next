<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
    import { toCssLength } from '@fibrae/semi-foundation/utils';
    import '@fibrae/semi-foundation/components/form/form.scss';
    import { IconHelpCircle } from '@fibrae/semi-icons-vue';
    import type { ElementProps } from '../../base/index';
    import useLocale from '../locale/use-locale';
    import Tooltip from '../tooltip';
    import type { LabelProps, LabelSlots } from './interface';

    // The attributes belong to the label element, the wrapper around it only exists with a tooltip
    defineOptions({ inheritAttrs: false });

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

    const hasTooltip = () => Boolean(slots.tooltip) || (props.tooltip !== undefined && props.tooltip !== '');

    const labelClass = () => [prefix, { [`${prefix}-left`]: props.align === 'left', [`${prefix}-right`]: props.align === 'right', [`${prefix}-required`]: props.required && !props.optional, [`${prefix}-disabled`]: props.disabled, [`${prefix}-with-extra`]: hasExtra() }];

    const widthStyle = () => (props.width === undefined ? undefined : { width: toCssLength(props.width) });
</script>

<template>
    <div v-if="hasTooltip()" :class="`${prefix}-with-tooltip`" :style="widthStyle()">
        <label v-bind="$attrs" :class="labelClass()" :for="props.name || undefined">
            <div :class="`${prefix}-text`" x-semi-prop="label">
                <slot>{{ props.text }}</slot>
                <span v-if="props.optional" :class="`${prefix}-optional-text`">{{ locale.locale.optional }}</span>
            </div>
            <div v-if="hasExtra()" :class="`${prefix}-extra`">
                <slot name="extra">{{ props.extra }}</slot>
            </div>
        </label>
        <Tooltip>
            <template #content>
                <slot name="tooltip">{{ props.tooltip }}</slot>
            </template>
            <button :aria-label="locale.locale.labelTooltip" :class="`${prefix}-tooltip`" type="button">
                <IconHelpCircle size="inherit" />
            </button>
        </Tooltip>
    </div>
    <label v-else v-bind="$attrs" :class="labelClass()" :for="props.name || undefined" :style="widthStyle()">
        <div :class="`${prefix}-text`" x-semi-prop="label">
            <slot>{{ props.text }}</slot>
            <span v-if="props.optional" :class="`${prefix}-optional-text`">{{ locale.locale.optional }}</span>
        </div>
        <div v-if="hasExtra()" :class="`${prefix}-extra`">
            <slot name="extra">{{ props.extra }}</slot>
        </div>
    </label>
</template>
