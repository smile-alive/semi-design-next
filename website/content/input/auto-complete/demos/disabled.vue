<script setup lang="ts">
    import { AutoComplete } from '@fibrae/semi-ui-vue';

    const data = [1, 2, 3, 4];
</script>

<template>
    <AutoComplete :data="data" disabled placeholder="禁用下拉菜单" style="width: 200px" />
</template>
