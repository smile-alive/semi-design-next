<script setup lang="ts">
    import { computed, useAttrs, useId } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/form/constants';
    import { joinIds } from '@fibrae/semi-foundation/utils/a11y';
    import '@fibrae/semi-foundation/form/form.scss';
    import type { ElementProps } from '../_base/element-props';
    import { groupRole } from '../_base/group-role';
    import { hasSlotContent } from '../_base/slot-nodes';
    import { useFormContext } from './context';
    import FormErrorMessage from './error-message.vue';
    import FieldGrid from './field-grid.vue';
    import type { FormProps, FormSlotProps, FormSlotSlots } from './interface';
    import FormLabel from './label.vue';
    import { isLabelConfig } from './utils';

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<FormSlotProps & /* @vue-ignore */ ElementProps<'div', keyof FormSlotProps>>(), {
        label: undefined,
        labelPosition: undefined,
        noLabel: undefined,
        error: undefined,
    });

    const slots = defineSlots<FormSlotSlots>();
    const attrs = useAttrs();

    const form = useFormContext();

    const id = useId();

    const prefix = cssClasses.PREFIX;
    const labelId = `${id}-label`;
    const formProps = computed<FormProps>(() => form?.formProps.value ?? {});
    const labelPosition = computed(() => props.labelPosition || formProps.value.labelPosition || 'top');
    const labelConfig = computed(() => (isLabelConfig(props.label) ? props.label : { text: props.label }));

    const labelProps = computed(() => ({
        align: formProps.value.labelAlign,
        width: formProps.value.labelWidth,
        ...labelConfig.value,
    }));

    // a rendered label names the slot, so the slot becomes a group its content belongs to
    const labelShown = () => !props.noLabel && ((labelConfig.value.text != null && labelConfig.value.text !== '') || hasSlotContent(slots.label));

    const rootAria = () => {
        const labelledby = joinIds(attrs['aria-labelledby'], labelShown() && labelId);
        return { role: groupRole({ ...attrs, 'aria-labelledby': labelledby }), 'aria-labelledby': labelledby };
    };
</script>

<template>
    <div v-bind="{ ...$attrs, ...rootAria() }" :class="[`${prefix}-field`, `${prefix}-slot`]" :x-label-pos="labelPosition">
        <FieldGrid :labelAlign="formProps.labelAlign" :labelCol="formProps.labelCol" :labelPosition="labelPosition" :mainClass="[`${prefix}-field-main`, `${prefix}-slot-main`]" :wrapperCol="formProps.wrapperCol">
            <template #label>
                <FormLabel v-if="!props.noLabel" v-bind="labelProps" :id="labelShown() ? labelId : undefined">
                    <template v-if="$slots.label" #default>
                        <slot name="label" />
                    </template>
                    <template v-if="$slots.labelExtra" #extra>
                        <slot name="labelExtra" />
                    </template>
                </FormLabel>
            </template>
            <slot />
            <FormErrorMessage v-if="props.error !== undefined" :error="props.error">
                <template v-if="$slots.error" #error="{ error }">
                    <slot :error="error" name="error" />
                </template>
            </FormErrorMessage>
        </FieldGrid>
    </div>
</template>
