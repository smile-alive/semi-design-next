<script setup lang="ts">
    import { computed, onBeforeUnmount, onMounted, useTemplateRef } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/resizable/constants';
    import { isSecondaryPress } from '@fibrae/semi-foundation/utils/pointer';
    import { IconHandle } from '@fibrae/semi-icons-vue';
    import type { ElementProps } from '../_base/element-props';
    import useLocale from '../locale/use-locale';
    import { useResizeGroupContext } from './context';
    import type { ResizeHandlerSlots } from './interface';

    // The foundation writes aria-valuenow, -valuemin, -valuemax and aria-controls; Vue patches only the attributes
    // its vnode has, so it leaves them alone.
    defineProps</* @vue-ignore */ ElementProps<'div'>>();
    defineSlots<ResizeHandlerSlots>();

    const group = useResizeGroupContext('ResizeHandler');
    const locale = useLocale('Resizable');

    const handler = useTemplateRef('handler');

    const prefix = cssClasses.PREFIX;
    const horizontal = computed(() => group.view.value.direction === 'horizontal');

    let unregister = () => {};

    const onPointerdown = (e: PointerEvent) => {
        if (isSecondaryPress(e)) return;
        // capturing keeps the moves and the release on the handler wherever the pointer goes
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        group.notifyResizeStart(e.currentTarget as HTMLDivElement, e);
    };

    const onKeydown = (e: KeyboardEvent) => {
        if (group.notifyKeyDown(e.currentTarget as HTMLDivElement, e)) {
            e.preventDefault();
        }
    };

    const onPointermove = (e: PointerEvent) => group.notifyResizing(e.currentTarget as HTMLDivElement, e);

    const onLostpointercapture = (e: PointerEvent) => group.notifyResizeEnd(e.currentTarget as HTMLDivElement, e);

    onMounted(() => {
        unregister = group.registerHandler(handler.value as HTMLDivElement);
    });

    onBeforeUnmount(() => unregister());
</script>

<template>
    <div
        ref="handler"
        :aria-label="locale.locale.separator"
        :aria-orientation="horizontal ? 'vertical' : 'horizontal'"
        :class="[`${prefix}-handler`, `${prefix}-handler-${group.view.value.direction}`]"
        role="separator"
        tabindex="0"
        @keydown="onKeydown"
        @lostpointercapture="onLostpointercapture"
        @pointerdown="onPointerdown"
        @pointermove="onPointermove"
    >
        <slot>
            <IconHandle size="inherit" :style="{ rotate: horizontal ? '0deg' : '90deg' }" />
        </slot>
    </div>
</template>
