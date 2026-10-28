<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import DragMove from '../..';

    // The handler getter reads a template ref inside the dragged child, which is set only after mount
    const handle = useTemplateRef<HTMLElement>('handle');
</script>

<template>
    <DragMove :handler="() => handle">
        <div>
            <span ref="handle">Handle</span>
            <span>Body</span>
        </div>
    </DragMove>
</template>
