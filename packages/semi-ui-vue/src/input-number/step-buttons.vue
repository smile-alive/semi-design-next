<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/input-number/constants';
    import { IconChevronDown, IconChevronUp } from '@fibrae/semi-icons-vue';

    // Not focusable, no role: the keyboard steps with the input's arrow keys.
    const props = defineProps<{
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
        ]"
    >
        <span
            :class="[
                `${prefix}-number-button`,
                `${prefix}-number-button-up`,
                {
                    [`${prefix}-number-button-up-disabled`]: props.disabled,
                    [`${prefix}-number-button-up-not-allowed`]: props.upNotAllowed,
                },
            ]"
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
            ]"
            @lostpointercapture="emit('release')"
            @mousedown="emit('mouseDown', $event)"
            @pointerdown="emit('pressDown', $event)"
        >
            <IconChevronDown size="extra-small" />
        </span>
    </div>
</template>
