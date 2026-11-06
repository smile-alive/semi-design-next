<script setup lang="ts">
    import { ColorPicker } from '@fibrae/semi-ui-vue';
</script>

<template>
    <ColorPicker alpha @change="(value) => console.log(value)">
        <template #topSlot>
            <div>TopSlot</div>
        </template>
        <template #bottomSlot>
            <div>Bottom Slot</div>
        </template>
    </ColorPicker>
</template>
