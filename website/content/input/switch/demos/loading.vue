<script setup lang="ts">
    import { Switch } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Switch aria-label="Loading switch" loading />
        <br />
        <Switch aria-label="Loading switch, on" defaultChecked loading />
    </div>
</template>
