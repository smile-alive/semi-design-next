<script setup lang="ts">
    import { TimePicker } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <TimePicker use12Hours />
        <br />
        <br />
        <TimePicker format="a h:mm" use12Hours />
    </div>
</template>
