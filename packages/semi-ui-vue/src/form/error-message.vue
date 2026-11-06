<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/form/constants';
    import { errorMessages, isErrorLeaf } from '@fibrae/semi-foundation/form/errors';
    import '@fibrae/semi-foundation/form/form.scss';
    import { IconAlertCircle, IconAlertTriangle } from '@fibrae/semi-icons-vue';
    import type { ElementProps } from '../_base/element-props';
    import { hasSlotContent } from '../_base/slot-nodes';
    import type { FormErrorMessageProps, FormErrorMessageSlots } from './interface';

    const props = withDefaults(defineProps<FormErrorMessageProps & /* @vue-ignore */ ElementProps<'div', keyof FormErrorMessageProps>>(), {
        error: undefined,
        showValidateIcon: undefined,
        validateStatus: undefined,
        isInInputGroup: undefined,
    });

    const slots = defineSlots<FormErrorMessageSlots>();

    const prefix = cssClasses.PREFIX;
    const iconClass = `${prefix}-field-validate-status-icon`;

    const hasHelpText = () => hasSlotContent(slots.helpText);

    const hasError = () => isErrorLeaf(props.error);

    // [''] (a rule with `message: ''`) fails without a text; showing helpText instead would look like success
    const rendered = () => (hasError() ? errorMessages(props.error).length > 0 : hasHelpText());
</script>

<template>
    <div v-if="rendered()" :class="{ [`${prefix}-field-error-message`]: hasError(), [`${prefix}-field-help-text`]: hasHelpText() }">
        <template v-if="props.showValidateIcon">
            <IconAlertCircle v-if="props.isInInputGroup || props.validateStatus === 'error'" :class="iconClass" />
            <IconAlertTriangle v-else-if="props.validateStatus === 'warning'" :class="iconClass" />
        </template>
        <span v-if="props.error && hasError()" :id="props.errorMessageId">
            <slot :error="props.error" name="error">{{ errorMessages(props.error).join(', ') }}</slot>
        </span>
        <span v-else :id="props.helpTextId">
            <slot name="helpText" />
        </span>
    </div>
</template>
