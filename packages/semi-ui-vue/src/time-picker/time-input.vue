<script setup lang="ts">
    import { onMounted, useTemplateRef, watch } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/time-picker/constants';
    import TimeInputFoundation, { type TimeInputAdapter } from '@fibrae/semi-foundation/time-picker/input-foundation';
    import { IconClock } from '@fibrae/semi-icons-vue';
    import useFoundation from '../_base/use-foundation';
    import useRaf from '../_base/use-raf';
    import Input from '../input/input.vue';
    import type { InputHandle } from '../input/interface';
    import type { TimeInputEmits, TimeInputProps, TimeInputSlots } from './interface';

    type Foundation = TimeInputFoundation<TimeInputProps, Record<string, never>, FocusEvent>;
    type Adapter = TimeInputAdapter<TimeInputProps, Record<string, never>, FocusEvent>;

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

    const { foundation } = useFoundation<Foundation, Adapter, TimeInputProps, Record<string, never>>(
        TimeInputFoundation,
        props,
        () => ({}),
        () => ({
            notifyChange: (value) => emit('update:modelValue', value),
            notifyFocus: (event) => emit('focus', event),
            notifyBlur: (event) => emit('blur', event),
            getInputNode: () => input.value?.input ?? null,
        })
    );

    const prefix = cssClasses.PREFIX;

    // Re-formatting moves the caret to the end; post flush runs after the Input wrote the new text
    watch(
        () => props.modelValue,
        () => foundation.restoreCursor(),
        { flush: 'post' }
    );

    const scheduleFrame = useRaf();

    onMounted(() =>
        scheduleFrame(() => {
            const node = input.value?.input;
            if (props.focusOnOpen && node) {
                node.focus({ preventScroll: props.preventScroll });
                node.select();
            }
        })
    );
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
            @blur="foundation.handleBlur($event)"
            @change="foundation.handleChange($event)"
            @focus="foundation.handleFocus($event)"
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
