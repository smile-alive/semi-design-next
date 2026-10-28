<script setup lang="ts">
    import ColorPicker from '../..';
</script>

<template>
    <ColorPicker alpha usePopover>
        <button type="button">pick</button>
        <template #topSlot>
            <div class="top-slot">top</div>
        </template>
        <template #bottomSlot>
            <div class="bottom-slot">bottom</div>
        </template>
    </ColorPicker>
</template>
