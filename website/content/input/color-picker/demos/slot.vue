<script setup lang="ts">
    import { ColorPicker, type ColorValue } from '@fibrae/semi-ui-vue';

    function onChange(value: ColorValue) {
        console.log(value);
    }
</script>

<template>
    <ColorPicker alpha @change="onChange">
        <template #topSlot>
            <div>TopSlot</div>
        </template>
        <template #bottomSlot>
            <div>Bottom Slot</div>
        </template>
    </ColorPicker>
</template>
