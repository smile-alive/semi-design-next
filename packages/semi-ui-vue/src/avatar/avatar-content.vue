<script setup lang="ts">
    import { computed, mergeProps, useTemplateRef, type ImgHTMLAttributes, type VNode } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/avatar/constants';

    const props = defineProps<{
        image?: ImgHTMLAttributes;
        text?: string;
        alt?: string;
        clickable: boolean;
        /** aria-* and tabindex given to a clickable avatar; they belong on its focus target. */
        controlAttrs: Record<string, unknown>;
        scale: number;
        hovered: boolean;
    }>();

    defineSlots<{ default?: () => VNode[]; hoverMask?: () => VNode[] }>();

    const content = useTemplateRef('content');

    const prefix = cssClasses.PREFIX;

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            (event.currentTarget as HTMLElement).click();
        }
    };

    const focusAttrs = computed(() =>
        props.clickable
            ? {
                  class: `${prefix}-no-focus-visible`,
                  role: 'button',
                  tabindex: 0,
                  ...props.controlAttrs,
                  onKeydown: handleKeyDown,
              }
            : {}
    );

    defineExpose({
        getText: (): string | undefined => content.value?.textContent ?? undefined,
        getTextWidths: () => (content.value ? { container: content.value.parentElement?.offsetWidth ?? 0, text: content.value.offsetWidth } : null),
    });
</script>

<template>
    <span>
        <img v-if="props.image" :alt="props.image.alt" v-bind="mergeProps({ ...props.image }, focusAttrs)" />
        <span v-else-if="props.text !== undefined" ref="content" :class="`${prefix}-content`" :style="{ transform: `scale(${props.scale})` }">
            <span :aria-label="props.alt ?? props.text" :class="`${prefix}-label`" role="img" v-bind="focusAttrs">{{ props.text }}</span>
        </span>
        <span v-else-if="props.clickable" :aria-label="props.alt" v-bind="focusAttrs">
            <slot />
        </span>
        <slot v-else />
        <div v-if="props.hovered && $slots.hoverMask" :class="`${prefix}-hover`">
            <slot name="hoverMask" />
        </div>
    </span>
</template>
