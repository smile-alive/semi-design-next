<script setup lang="ts">
    import { Avatar } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div><Avatar v-for="index in 3" :key="index" border color="amber" :style="{ marginRight: '8px' }">T</Avatar></div>
</template>
