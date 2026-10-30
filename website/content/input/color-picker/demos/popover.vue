<script setup lang="ts">
    import { Button, ColorPicker, type ColorValue } from '@fibrae/semi-ui-vue';

    const onChange = (value: ColorValue) => {
        console.log(value);
    };
</script>

<template>
    <div>
        <ColorPicker alpha usePopover @change="onChange" />
        <br />
        <div>自定义 trigger</div>
        <ColorPicker alpha usePopover @change="onChange">
            <Button> Trigger </Button>
        </ColorPicker>
    </div>
</template>
