<script setup lang="ts">
    import Numeral from '../../numeral.vue';
</script>

<template>
    <Numeral :precision="1"><p class="x">1.234</p></Numeral>
</template>

<style scoped>
    .x {
        color: red;
    }
</style>
