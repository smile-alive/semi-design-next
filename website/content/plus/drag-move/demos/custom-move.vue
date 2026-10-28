<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import { DragMove } from '@fibrae/semi-ui-vue';

    const container = useTemplateRef<HTMLDivElement>('container');
    let startPoint: { x: number; y: number } | null = null;

    function customMove(element: HTMLElement, top: number, left: number) {
        const bounds = container.value;
        if (bounds && left + 100 > bounds.offsetWidth) {
            element.style.right = `${bounds.offsetWidth - left - element.offsetWidth}px`;
            element.style.left = 'auto';
        } else {
            element.style.left = left + 'px';
        }
        element.style.top = top + 'px';
    }

    function toggleWidth(element: HTMLElement) {
        element.style.width = element.style.width === '60px' ? '100px' : '60px';
    }

    function onMouseDown(e: MouseEvent) {
        startPoint = { x: e.clientX, y: e.clientY };
    }

    function onMouseUp(e: MouseEvent) {
        if (startPoint && Math.abs(e.clientX - startPoint.x) < 5 && Math.abs(e.clientY - startPoint.y) < 5) {
            toggleWidth(e.currentTarget as HTMLElement);
        }
        startPoint = null;
    }

    function onKeyDown(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            toggleWidth(e.currentTarget as HTMLElement);
        }
    }
</script>

<template>
    <span>蓝色色块点击可改变宽度，改变前后蓝色色块均不会超出范围限制 </span>
    <br />
    <br />
    <div
        ref="container"
        :style="{
            backgroundColor: 'var(--semi-grey-2)',
            width: '300px',
            height: '300px',
            position: 'relative',
            padding: '10px',
            color: 'var(--semi-white)',
            fontWeight: 500,
        }"
    >
        <span :style="{ color: 'var(--semi-color-text-0)' }">Constrainer</span>
        <DragMove :constrainer="() => container" :customMove="customMove">
            <button
                :style="{
                    backgroundColor: 'var(--semi-color-primary)',
                    boxSizing: 'content-box',
                    width: '60px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'absolute',
                    top: '50px',
                    left: '50px',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '5px',
                    color: 'inherit',
                    font: 'inherit',
                }"
                type="button"
                @keydown="onKeyDown"
                @mousedown="onMouseDown"
                @mouseup="onMouseUp"
            >
                Drag me
            </button>
        </DragMove>
    </div>
</template>
