<script setup lang="ts">
    import { AutoComplete } from '@fibrae/semi-ui-vue';

    const data = [1, 2, 3, 4];
</script>

<template>
    <div>
        <AutoComplete :data="data" placeholder="small" size="small" style="width: 200px" />
        <br />
        <br />
        <AutoComplete :data="data" placeholder="default" size="default" style="width: 200px" />
        <br />
        <br />
        <AutoComplete :data="data" placeholder="large" size="large" style="width: 200px" />
    </div>
</template>
