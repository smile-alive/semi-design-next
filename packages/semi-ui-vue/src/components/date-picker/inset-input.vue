<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import Input from '../input/input.vue';
    import type { DatePickerFocusTarget, DatePickerInsetBoxEmits, DatePickerInsetBoxProps } from './internal';

    const props = withDefaults(defineProps<DatePickerInsetBoxProps>(), { placeholder: undefined, disabled: false });
    const emit = defineEmits<DatePickerInsetBoxEmits>();

    const input = useTemplateRef('input');

    const field = () => (props.kind === 'date' ? 'dateInput' : 'timeInput');

    const handleChange = (value: string, event: Event) => emit('change', { value, event, insetInputValue: props.insetInputValue, panel: props.panel, field: field() });

    defineExpose<DatePickerFocusTarget>({
        focus: (options) => input.value?.focus(options),
        blur: () => input.value?.blur(),
        get input() {
            return input.value?.input ?? null;
        },
    });
</script>

<template>
    <Input v-if="props.kind === 'date' || props.type.includes('Time')" ref="input" :aria-label="props.ariaLabel" :disabled="props.disabled" :modelValue="props.insetInputValue[props.panel][field()]" :placeholder="props.placeholder" :showClear="false" @change="handleChange" @focus="emit('focus', $event)" />
</template>
