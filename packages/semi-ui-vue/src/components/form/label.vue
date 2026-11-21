<script setup lang="ts">
    import { useAttrs } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
    import { toCssLength } from '@fibrae/semi-foundation/utils';
    import '@fibrae/semi-foundation/components/form/form.scss';
    import { IconHelpCircleStroked } from '@fibrae/semi-icons-vue';
    import type { ElementProps } from '../../base/index';
    import useLocale from '../locale/use-locale';
    import Tooltip from '../tooltip';
    import { useFormContext } from './context';
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
    const attrs = useAttrs();

    const locale = useLocale('Form');
    const form = useFormContext();

    const prefix = `${cssClasses.PREFIX}-field-label`;

    const hasExtra = () => Boolean(slots.extra) || (props.extra !== undefined && props.extra !== '');

    const hasTooltip = () => Boolean(slots.tooltip) || (props.tooltip !== undefined && props.tooltip !== '');

    const labelClass = () => [prefix, { [`${prefix}-left`]: props.align === 'left', [`${prefix}-right`]: props.align === 'right', [`${prefix}-required`]: props.required && !props.optional, [`${prefix}-disabled`]: props.disabled, [`${prefix}-with-extra`]: hasExtra() }];

    const widthStyle = () => (props.width === undefined ? undefined : { width: toCssLength(props.width) });

    // the Form's parts come before the caller's, so the caller's value wins
    const labelAttrs = (withWidth: boolean) => ({
        ...attrs,
        class: [form?.formProps.value.classNames?.label, attrs.class],
        style: [form?.formProps.value.styles?.label, attrs.style, withWidth && widthStyle()],
    });

    const partClass = (part: 'text' | 'extra' | 'tooltip', formPart: 'labelText' | 'labelExtra' | 'labelTooltip') => [`${prefix}-${part}`, form?.formProps.value.classNames?.[formPart], props.classNames?.[part]];

    const partStyle = (part: 'text' | 'extra' | 'tooltip', formPart: 'labelText' | 'labelExtra' | 'labelTooltip') => [form?.formProps.value.styles?.[formPart], props.styles?.[part]];
</script>

<template>
    <div v-if="hasTooltip()" :class="`${prefix}-with-tooltip`" :style="widthStyle()">
        <label v-bind="labelAttrs(false)" :class="labelClass()" :for="props.name || undefined">
            <div :class="partClass('text', 'labelText')" :style="partStyle('text', 'labelText')" x-semi-prop="label">
                <slot>{{ props.text }}</slot>
                <span v-if="props.optional" :class="`${prefix}-optional-text`">{{ locale.locale.optional }}</span>
            </div>
            <div v-if="hasExtra()" :class="partClass('extra', 'labelExtra')" :style="partStyle('extra', 'labelExtra')">
                <slot name="extra">{{ props.extra }}</slot>
            </div>
        </label>
        <Tooltip>
            <template #content>
                <slot name="tooltip">{{ props.tooltip }}</slot>
            </template>
            <button :aria-label="locale.locale.labelTooltip" :class="partClass('tooltip', 'labelTooltip')" :style="partStyle('tooltip', 'labelTooltip')" type="button">
                <IconHelpCircleStroked size="inherit" />
            </button>
        </Tooltip>
    </div>
    <label v-else v-bind="labelAttrs(true)" :class="labelClass()" :for="props.name || undefined">
        <div :class="partClass('text', 'labelText')" :style="partStyle('text', 'labelText')" x-semi-prop="label">
            <slot>{{ props.text }}</slot>
            <span v-if="props.optional" :class="`${prefix}-optional-text`">{{ locale.locale.optional }}</span>
        </div>
        <div v-if="hasExtra()" :class="partClass('extra', 'labelExtra')" :style="partStyle('extra', 'labelExtra')">
            <slot name="extra">{{ props.extra }}</slot>
        </div>
    </label>
</template>
