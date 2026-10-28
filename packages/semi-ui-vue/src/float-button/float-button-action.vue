<script setup lang="ts">
    // A link with `href`, else a native button. A link has no native disabled state: a disabled one drops `href` (not
    // followable or focusable) and takes role="link" plus aria-disabled, since an `a` without href has no role.
    defineOptions({ inheritAttrs: false });

    const props = withDefaults(
        defineProps<{
            disabled?: boolean;
            href?: string;
            rel?: string;
            target?: string;
        }>(),
        { disabled: false }
    );

    const emit = defineEmits<{ click: [event: MouseEvent] }>();

    // Chrome still delivers a click from a child of a disabled button.
    const handleClick = (event: MouseEvent) => {
        if (!props.disabled) emit('click', event);
    };
</script>

<template>
    <!-- explicit attributes follow $attrs so a consumer's type, role or aria-disabled cannot undo the semantics -->
    <a v-if="props.href" v-bind="$attrs" :aria-disabled="props.disabled || undefined" :href="props.disabled ? undefined : props.href" :rel="props.disabled ? undefined : props.rel" :role="props.disabled ? 'link' : undefined" :target="props.disabled ? undefined : props.target" :type="undefined" @click="handleClick">
        <slot />
    </a>
    <button v-else v-bind="$attrs" :aria-disabled="props.disabled || undefined" :disabled="props.disabled" type="button" @click="handleClick">
        <slot />
    </button>
</template>
