<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/components/time-picker/constants';
    import TimeInputFoundation, { type TimeInputAdapter, type TimeInputState } from '@fibrae/semi-foundation/components/time-picker/input-foundation';
    import { IconClock } from '@fibrae/semi-icons-vue';
    import useFoundation from '../../base/use-foundation';
    import Input from '../input/input.vue';
    import type { InputHandle } from '../input/interface';
    import type { TimeInputEmits, TimeInputProps, TimeInputSlots } from './interface';

    type FoundationProps = TimeInputProps & { value?: string };
    type Foundation = TimeInputFoundation<FoundationProps, FocusEvent>;
    type Adapter = TimeInputAdapter<FoundationProps, FocusEvent>;

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<TimeInputProps>(), {
        modelValue: undefined,
        inputReadOnly: false,
        invalid: false,
        validateStatus: undefined,
        focusOnOpen: false,
        preventScroll: undefined,
    });

    const emit = defineEmits<TimeInputEmits>();
    defineSlots<TimeInputSlots>();

    // Annotated: the adapter's getInputNode reads this ref, so inference is circular (TS7022)
    const input = useTemplateRef<InputHandle>('input');

    const { foundation } = useFoundation<Foundation, Adapter, FoundationProps, TimeInputState>(
        TimeInputFoundation,
        props,
        () => ({}),
        () => ({
            notifyChange: (value) => emit('update:modelValue', value),
            notifyFocus: (event) => emit('focus', event),
            notifyBlur: (event) => emit('blur', event),
            getInputNode: () => input.value?.input ?? null,
        }),
        { props: { value: () => props.modelValue } }
    );

    const prefix = cssClasses.PREFIX;
</script>

<template>
    <div :class="`${prefix}-input-wrap`">
        <Input
            ref="input"
            v-bind="$attrs"
            :class="[`${prefix}-input`, { [`${prefix}-input-invalid`]: props.invalid, [`${prefix}-input-readonly`]: props.inputReadOnly }]"
            hideSuffix
            :modelValue="props.modelValue"
            :preventScroll="props.preventScroll"
            :readOnly="props.inputReadOnly"
            :validateStatus="props.invalid ? 'error' : props.validateStatus"
            @blur="foundation.handleBlur"
            @change="foundation.handleChange"
            @focus="foundation.handleFocus"
        >
            <template v-if="$slots.prefix" #prefix>
                <slot name="prefix" />
            </template>
            <template v-if="$slots.insetLabel" #insetLabel>
                <slot name="insetLabel" />
            </template>
            <template v-if="$slots.clearIcon" #clearIcon>
                <slot name="clearIcon" />
            </template>
            <template #suffix>
                <IconClock />
            </template>
        </Input>
    </div>
</template>
