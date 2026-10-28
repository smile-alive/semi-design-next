<script setup lang="ts">
    import { InputNumber } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div style="width: 180px">
        <span id="inputnumber-size-default">默认尺寸 size=default</span>
        <InputNumber aria-labelledby="inputnumber-size-default" />
        <br />
        <br />

        <span id="inputnumber-size-large">大尺寸 size=large</span>
        <InputNumber aria-labelledby="inputnumber-size-large" size="large" />
        <br />
        <br />

        <span id="inputnumber-size-small">小尺寸 size=small</span>
        <InputNumber aria-labelledby="inputnumber-size-small" size="small" />
        <br />
    </div>
</template>
