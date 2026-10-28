<script setup lang="ts">
    import { TimePicker } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <TimePicker :defaultValue="['10:23:15', '12:38:32']" type="timeRange" />
        <br />
        <br />
        <TimePicker :defaultValue="['上午 08:11', '下午 11:21']" format="a h:mm" type="timeRange" use12Hours />
    </div>
</template>
