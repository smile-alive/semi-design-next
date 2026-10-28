<script setup lang="ts">
    import { Rating } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Rating :defaultValue="5" />
        <br />
        <br />
        <Rating :defaultValue="5" size="small" />
    </div>
</template>
