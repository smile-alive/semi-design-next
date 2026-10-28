<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/date-picker/constants';
    import Button from '../button/button.vue';
    import type { DatePickerFooterEmits, DatePickerFooterProps } from './internal';

    const props = withDefaults(defineProps<DatePickerFooterProps>(), { disabledConfirm: false });
    const emit = defineEmits<DatePickerFooterEmits>();

    const prefix = cssClasses.PREFIX;
</script>

<template>
    <div :class="`${prefix}-footer`">
        <Button theme="borderless" @click="emit('cancel')">{{ props.locale.footer.cancel }}</Button>
        <Button :disabled="props.disabledConfirm" theme="solid" @click="emit('confirm')">
            {{ props.locale.footer.confirm }}
        </Button>
    </div>
</template>
