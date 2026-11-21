<script setup lang="ts">
    import type { ClassValue, StyleValue } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/components/input-number/constants';
    import { IconChevronDown, IconChevronUp } from '@fibrae/semi-icons-vue';

    type StepPart = 'actions' | 'upButton' | 'downButton';

    // Not focusable, no role: the keyboard steps with the input's arrow keys.
    const props = defineProps<{
        classNames?: Partial<Record<StepPart, ClassValue>>;
        styles?: Partial<Record<StepPart, StyleValue>>;
        inner: boolean;
        innerHover: boolean;
        disabled: boolean;
        upNotAllowed: boolean;
        downNotAllowed: boolean;
    }>();

    const emit = defineEmits<{
        pressUp: [event: PointerEvent];
        pressDown: [event: PointerEvent];
        mouseDown: [event: MouseEvent];
        release: [];
    }>();

    const prefix = cssClasses.PREFIX;
</script>

<template>
    <div
        :class="[
            `${prefix}-number-suffix-btns`,
            {
                [`${prefix}-number-suffix-btns-inner`]: props.inner,
                [`${prefix}-number-suffix-btns-inner-hover`]: props.innerHover,
            },
            props.classNames?.actions,
        ]"
        :style="props.styles?.actions"
    >
        <span
            :class="[
                `${prefix}-number-button`,
                `${prefix}-number-button-up`,
                {
                    [`${prefix}-number-button-up-disabled`]: props.disabled,
                    [`${prefix}-number-button-up-not-allowed`]: props.upNotAllowed,
                },
                props.classNames?.upButton,
            ]"
            :style="props.styles?.upButton"
            @lostpointercapture="emit('release')"
            @mousedown="emit('mouseDown', $event)"
            @pointerdown="emit('pressUp', $event)"
        >
            <IconChevronUp size="extra-small" />
        </span>
        <span
            :class="[
                `${prefix}-number-button`,
                `${prefix}-number-button-down`,
                {
                    [`${prefix}-number-button-down-disabled`]: props.disabled,
                    [`${prefix}-number-button-down-not-allowed`]: props.downNotAllowed,
                },
                props.classNames?.downButton,
            ]"
            :style="props.styles?.downButton"
            @lostpointercapture="emit('release')"
            @mousedown="emit('mouseDown', $event)"
            @pointerdown="emit('pressDown', $event)"
        >
            <IconChevronDown size="extra-small" />
        </span>
    </div>
</template>
