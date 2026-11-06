<script setup lang="ts">
    import { Switch } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Switch aria-label="a switch for demo" @change="(checked) => console.log(checked)" />
        <br />
        <Switch aria-label="a switch for semi demo" defaultChecked @change="(checked) => console.log(checked)" />
    </div>
</template>
