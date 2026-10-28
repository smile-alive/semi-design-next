<script setup lang="ts">
    defineOptions({ inheritAttrs: false });
</script>

<template>
    <span v-bind="$attrs" :style="{ display: 'inline-block', padding: '4px' }">own style</span>
</template>
