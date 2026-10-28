<script setup lang="ts">
    import type { StyleValue, VNode } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/form/constants';
    import '@fibrae/semi-foundation/form/form.scss';
    import slotKind from '../_base/slot-kind';
    import { hasSlotContent } from '../_base/slot-nodes';
    import type { ColProps } from '../grid/interface';
    import type { ValidateStatus } from '../input/interface';
    import FormErrorMessage from './error-message.vue';
    import FieldGrid from './field-grid.vue';
    import type { FieldError, LabelProps } from './interface';
    import FormLabel from './label.vue';

    const props = withDefaults(
        defineProps<{
            field: string;
            name?: string;
            fieldClassName?: string;
            fieldStyle?: StyleValue;
            labelPosition?: string;
            labelAlign?: string;
            labelCol?: ColProps;
            wrapperCol?: ColProps;
            /** Wraps the columns in the field's own Row */
            row?: boolean;
            /** The Label's props; undefined renders no Label */
            label?: LabelProps & { id: string };
            extraTextPosition?: string;
            noErrorMessage?: boolean;
            error?: FieldError;
            validateStatus?: ValidateStatus;
            showValidateIcon?: boolean;
            errorMessageId: string;
            helpTextId: string;
            extraTextId: string;
        }>(),
        { fieldStyle: undefined, row: undefined, noErrorMessage: undefined, error: undefined, showValidateIcon: undefined }
    );

    const slots = defineSlots<{
        default?: () => VNode[];
        label?: () => VNode[];
        labelExtra?: () => VNode[];
        helpText?: () => VNode[];
        extraText?: () => VNode[];
        error?: (props: { error: FieldError }) => VNode[];
    }>();

    const prefix = cssClasses.PREFIX;

    const extraShown = (position: string) => props.extraTextPosition === position && hasSlotContent(slots.extraText);

    const extraClass = () => [
        `${prefix}-field-extra`,
        {
            [`${prefix}-field-extra-string`]: slotKind(slots.extraText) === 'text',
            [`${prefix}-field-extra-middle`]: props.extraTextPosition === 'middle',
            [`${prefix}-field-extra-bottom`]: props.extraTextPosition === 'bottom',
        },
    ];
</script>

<template>
    <div :class="[`${prefix}-field`, { [`${prefix}-field-${props.name}`]: props.name }, props.fieldClassName]" :style="props.fieldStyle" :x-extra-pos="props.extraTextPosition" :x-field-id="props.field" :x-label-pos="props.labelPosition">
        <FieldGrid :labelAlign="props.labelAlign" :labelCol="props.labelCol" :labelPosition="props.labelPosition" :mainClass="`${prefix}-field-main`" :row="props.row" :wrapperCol="props.wrapperCol">
            <template #label>
                <FormLabel v-if="props.label" v-bind="props.label">
                    <template v-if="$slots.label" #default>
                        <slot name="label" />
                    </template>
                    <template v-if="$slots.labelExtra" #extra>
                        <slot name="labelExtra" />
                    </template>
                </FormLabel>
            </template>
            <div v-if="extraShown('middle')" :id="props.extraTextId" :class="extraClass()" x-semi-prop="extraText">
                <slot name="extraText" />
            </div>
            <slot />
            <FormErrorMessage v-if="!props.noErrorMessage" :error="props.error" :errorMessageId="props.errorMessageId" :helpTextId="props.helpTextId" :showValidateIcon="props.showValidateIcon" :validateStatus="props.validateStatus">
                <template v-if="$slots.helpText" #helpText>
                    <slot name="helpText" />
                </template>
                <template v-if="$slots.error" #error="{ error }">
                    <slot :error="error" name="error" />
                </template>
            </FormErrorMessage>
            <div v-if="extraShown('bottom')" :id="props.extraTextId" :class="extraClass()" x-semi-prop="extraText">
                <slot name="extraText" />
            </div>
        </FieldGrid>
    </div>
</template>
