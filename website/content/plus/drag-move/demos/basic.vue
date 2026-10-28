<script setup lang="ts">
    import { DragMove } from '@fibrae/semi-ui-vue';
</script>

<template>
    <!-- DragMove positions the element absolutely, so the wrapper keeps room for it in the preview -->
    <div :style="{ height: '120px' }">
        <DragMove>
            <div
                :style="{
                    backgroundColor: 'var(--semi-color-primary)',
                    width: '80px',
                    height: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '10px',
                    fontWeight: 500,
                    position: 'absolute',
                    color: 'var(--semi-white)',
                }"
            >
                Drag me
            </div>
        </DragMove>
    </div>
</template>
