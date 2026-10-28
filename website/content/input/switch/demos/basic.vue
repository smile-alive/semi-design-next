<script setup lang="ts">
    import { Switch } from '@fibrae/semi-ui-vue';

    const log = (checked: boolean) => console.log(checked);
</script>

<template>
    <div>
        <Switch aria-label="a switch for demo" @change="log" />
        <br />
        <Switch aria-label="a switch for semi demo" defaultChecked @change="log" />
    </div>
</template>
