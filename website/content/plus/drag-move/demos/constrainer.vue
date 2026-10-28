<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import { DragMove } from '@fibrae/semi-ui-vue';

    const container = useTemplateRef<HTMLDivElement>('container');
</script>

<template>
    <div
        ref="container"
        :style="{
            backgroundColor: 'var(--semi-grey-2)',
            width: '300px',
            height: '300px',
            padding: '5px',
            position: 'relative',
            color: 'var(--semi-white)',
            fontWeight: 500,
        }"
    >
        <span :style="{ color: 'var(--semi-color-text-0)' }">Constrainer</span>
        <DragMove :constrainer="() => container">
            <div
                :style="{
                    backgroundColor: 'var(--semi-color-primary)',
                    width: '80px',
                    height: '80px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'absolute',
                    top: '80px',
                    left: '80px',
                }"
            >
                Drag me
            </div>
        </DragMove>
    </div>
</template>
