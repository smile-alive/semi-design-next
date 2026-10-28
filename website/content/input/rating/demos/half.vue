<script setup lang="ts">
    import { Rating } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Rating allowHalf :defaultValue="3.5" />
        <br />
        <Rating allowHalf :defaultValue="3.65" disabled />
    </div>
</template>
