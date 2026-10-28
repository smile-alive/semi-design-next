<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import { IconTransparentStroked } from '@fibrae/semi-icons-vue';
    import { DragMove } from '@fibrae/semi-ui-vue';

    const handlerEl = useTemplateRef<HTMLDivElement>('handlerEl');
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
        <DragMove :constrainer="() => container" :handler="() => handlerEl">
            <div
                :style="{
                    backgroundColor: 'var(--semi-color-primary)',
                    width: '80px',
                    height: '80px',
                    borderRadius: '10px',
                    position: 'absolute',
                    top: '50px',
                    left: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }"
            >
                <div ref="handlerEl" :style="{ width: 'fit-content', height: 'fit-content' }">
                    <IconTransparentStroked size="large" />
                </div>
            </div>
        </DragMove>
    </div>
</template>
