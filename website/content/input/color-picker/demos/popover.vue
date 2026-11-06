<script setup lang="ts">
    import { Button, ColorPicker } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <ColorPicker alpha usePopover @change="(value) => console.log(value)" />
        <br />
        <div>自定义 trigger</div>
        <ColorPicker alpha usePopover @change="(value) => console.log(value)">
            <Button> Trigger </Button>
        </ColorPicker>
    </div>
</template>
