<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/form/constants';
    import '@fibrae/semi-foundation/form/form.scss';
    import { IconAlertCircle, IconAlertTriangle } from '@fibrae/semi-icons-vue';
    import type { ElementProps } from '../_base/element-props';
    import { hasSlotContent } from '../_base/slot-nodes';
    import type { FormErrorMessageProps, FormErrorMessageSlots } from './interface';
    import { errorText, hasErrorContent } from './utils';

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

    const rendered = () => {
        const { error } = props;
        if (!error && !hasHelpText()) return false;
        // async-validator's `message: ''` means "failed, but hide the text"; showing helpText would look like success
        if (error === '' && props.validateStatus === 'error') return false;
        return !(Array.isArray(error) && !hasErrorContent(error) && !hasHelpText());
    };

    const textRendered = () => (props.error ? hasErrorContent(props.error) : hasHelpText());
</script>

<template>
    <div v-if="rendered()" :class="{ [`${prefix}-field-error-message`]: Boolean(props.error), [`${prefix}-field-help-text`]: hasHelpText() }">
        <template v-if="textRendered()">
            <template v-if="props.showValidateIcon">
                <IconAlertCircle v-if="props.isInInputGroup || props.validateStatus === 'error'" :class="iconClass" />
                <IconAlertTriangle v-else-if="props.validateStatus === 'warning'" :class="iconClass" />
            </template>
            <span v-if="props.error" :id="props.errorMessageId">
                <slot :error="props.error" name="error">{{ errorText(props.error) }}</slot>
            </span>
            <span v-else :id="props.helpTextId">
                <slot name="helpText" />
            </span>
        </template>
    </div>
</template>
