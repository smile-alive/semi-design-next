<script setup lang="ts">
    import { type VNode, computed, shallowReactive, useAttrs, useId } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/form/constants';
    import { isValid } from '@fibrae/semi-foundation/form/utils';
    import { joinIds } from '@fibrae/semi-foundation/utils/a11y';
    import * as ObjectUtil from '@fibrae/semi-foundation/utils/object';
    import warning from '@fibrae/semi-foundation/utils/warning';
    import '@fibrae/semi-foundation/form/form.scss';
    import type { ElementProps } from '../_base/element-props';
    import slotKind from '../_base/slot-kind';
    import slotNodes, { hasSlotContent } from '../_base/slot-nodes';
    import InputGroup from '../input/input-group.vue';
    import { provideFormInputGroupContext, useFormContext } from './context';
    import FormErrorMessage from './error-message.vue';
    import FieldGrid from './field-grid.vue';
    import type { FormInputGroupProps, FormInputGroupSlots, FormProps } from './interface';
    import FormLabel from './label.vue';
    import { isLabelConfig } from './utils';

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<FormInputGroupProps & /* @vue-ignore */ ElementProps<'div', keyof FormInputGroupProps>>(), {
        disabled: undefined,
        label: undefined,
        labelPosition: undefined,
        extraTextPosition: 'bottom',
    });

    const slots = defineSlots<FormInputGroupSlots>();
    const attrs = useAttrs();

    const form = useFormContext();

    warning(!form, '[Semi Form]: FormInputGroup must be used inside the Form, please check your dom declaration');

    const id = useId();
    const fields = shallowReactive<string[]>([]);

    const prefix = cssClasses.PREFIX;
    const errorMessageId = `${id}-errormessage`;
    const extraTextId = `${id}-extraText`;
    const formProps = computed<FormProps>(() => form?.formProps.value ?? {});
    const labelPosition = computed(() => props.labelPosition || formProps.value.labelPosition);
    const labelConfig = computed(() => (isLabelConfig(props.label) ? props.label : { text: props.label }));
    const labelId = computed(() => labelConfig.value.id ?? `${id}-label`);
    const groupError = computed(() => fields.map((field) => ObjectUtil.get(form?.formState.value.errors ?? {}, field)));

    provideFormInputGroupContext({
        registerField: (field) => {
            fields.push(field);
            return () => {
                fields.splice(fields.indexOf(field), 1);
            };
        },
    });

    const hasLabel = () => Boolean(props.label) || hasSlotContent(slots.label);

    const extraShown = (position: string) => props.extraTextPosition === position && hasSlotContent(slots.extraText);

    const extraClass = () => [
        `${prefix}-field-extra`,
        {
            [`${prefix}-field-extra-string`]: slotKind(slots.extraText) === 'text',
            [`${prefix}-field-extra-middle`]: props.extraTextPosition === 'middle',
            [`${prefix}-field-extra-bottom`]: props.extraTextPosition === 'bottom',
        },
    ];

    const fieldNodes = () => slotNodes(slots.default?.() ?? []).filter(([node]) => node.props?.field != null);

    const innerAttrs = () => {
        const { 'aria-labelledby': _labelledby, 'aria-describedby': _describedby, 'aria-errormessage': _errormessage, ...rest } = attrs;
        return { ...rest, disabled: props.disabled ?? formProps.value.disabled };
    };

    // joined with each field's own references: the group's label, extra text and error message name every field in it
    const fieldAria = (node: VNode) => ({
        'aria-labelledby': joinIds(node.props?.['aria-labelledby'], attrs['aria-labelledby'], hasLabel() && labelId.value),
        'aria-describedby': joinIds(node.props?.['aria-describedby'], attrs['aria-describedby'], hasSlotContent(slots.extraText) && extraTextId),
        'aria-errormessage': errorMessageId,
    });
</script>

<template>
    <div v-if="form" :aria-labelledby="hasLabel() ? labelId : undefined" :class="`${prefix}-field-group`" :role="hasLabel() ? 'group' : undefined" :x-label-pos="labelPosition">
        <FieldGrid :labelAlign="formProps.labelAlign" :labelCol="formProps.labelCol" :labelPosition="labelPosition" :wrapperCol="formProps.wrapperCol">
            <template #label>
                <FormLabel v-if="hasLabel()" v-bind="{ width: formProps.labelWidth, ...labelConfig }" :id="labelId">
                    <template v-if="$slots.label" #default>
                        <slot name="label" />
                    </template>
                    <template v-if="$slots.labelExtra" #extra>
                        <slot name="labelExtra" />
                    </template>
                </FormLabel>
            </template>
            <div v-if="extraShown('middle')" :id="extraTextId" :class="extraClass()" x-semi-prop="extraText">
                <slot name="extraText" />
            </div>
            <InputGroup v-bind="innerAttrs()">
                <component :is="node" v-for="[node, key] in fieldNodes()" :key="key" v-bind="fieldAria(node)" />
            </InputGroup>
            <div v-if="extraShown('bottom')" :id="extraTextId" :class="extraClass()" x-semi-prop="extraText">
                <slot name="extraText" />
            </div>
            <FormErrorMessage v-if="!isValid(groupError)" :error="groupError" :errorMessageId="errorMessageId" isInInputGroup :showValidateIcon="formProps.showValidateIcon" />
        </FieldGrid>
    </div>
</template>
