<script setup lang="ts">
    import { cssClasses, numbers } from '@fibrae/semi-foundation/table/constants';
    import { isSecondaryPress } from '@fibrae/semi-foundation/utils/pointer';

    /**
     * The header cell of a resizable table, set as `components.header.cell`. It gets every attribute of the header cell;
     * the width and the resize listeners come from the column's onHeaderCell, which ResizableTable wraps.
     */
    const props = withDefaults(
        defineProps<{
            width?: number | string;
            /** `false` turns resizing off for the column; a Boolean left out would read as false */
            resize?: boolean;
        }>(),
        { width: undefined, resize: undefined }
    );

    const emit = defineEmits<{
        resize: [event: PointerEvent, data: { size: { width: number } }];
        resizeStart: [event: PointerEvent];
        resizeStop: [event: PointerEvent];
    }>();

    let press: { x: number; width: number; sign: number } | null = null;

    const handlePointerDown = (event: PointerEvent) => {
        if (isSecondaryPress(event) || typeof props.width !== 'number') {
            return;
        }
        // keeps the press from starting a text selection, which would break the drag
        event.preventDefault();
        const handle = event.currentTarget as HTMLElement;
        handle.setPointerCapture(event.pointerId);
        const rtl = handle.parentElement ? getComputedStyle(handle.parentElement).direction === 'rtl' : false;
        press = { x: event.clientX, width: props.width, sign: rtl ? -1 : 1 };
        emit('resizeStart', event);
    };

    const handlePointerMove = (event: PointerEvent) => {
        if (press) {
            const dragged = press.width + (event.clientX - press.x) * press.sign;
            emit('resize', event, { size: { width: Math.max(numbers.MIN_RESIZE_WIDTH, dragged) } });
        }
    };

    // the browser releases the capture on pointerup and pointercancel, so lostpointercapture ends every drag
    const handlePointerEnd = (event: PointerEvent) => {
        if (press) {
            press = null;
            emit('resizeStop', event);
        }
    };
</script>

<template>
    <th v-if="typeof props.width !== 'number' || props.resize === false">
        <slot />
    </th>
    <th v-else>
        <slot />
        <!-- pointer only (no keyboard column resize); @click.stop keeps a drag's final click from sorting -->
        <span :class="`${cssClasses.PREFIX}-resize-handle`" @click.stop @lostpointercapture="handlePointerEnd" @pointerdown="handlePointerDown" @pointermove="handlePointerMove" />
    </th>
</template>
