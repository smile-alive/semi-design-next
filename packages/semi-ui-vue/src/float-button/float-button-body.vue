<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/float-button/constants';
    import type { FloatButtonShape, FloatButtonSize } from './interface';

    const props = withDefaults(
        defineProps<{
            colorful?: boolean;
            disabled?: boolean;
            shape?: FloatButtonShape;
            size?: FloatButtonSize;
        }>(),
        { colorful: false, disabled: false }
    );

    const prefix = cssClasses.PREFIX;
</script>

<template>
    <!-- A span, not a div: the body sits inside a native button or link, which only take phrasing content. -->
    <span :class="[`${prefix}-body`, { [`${prefix}-${props.shape}`]: props.shape, [`${prefix}-colorful`]: props.colorful, [`${prefix}-disabled`]: props.disabled, [`${prefix}-${props.size}`]: props.size }]">
        <slot />
    </span>
</template>
