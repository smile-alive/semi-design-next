<script setup lang="ts">
    import Numeral from '../../numeral.vue';

    const items = [1, 2];
</script>

<template>
    <Numeral :precision="1">
        <template v-for="item in items" :key="item">{{ item }}</template>
        <template v-if="false">0</template>
        <span
            >x<b>{{ 3 }}</b></span
        >
    </Numeral>
    <Numeral :precision="1"
        >Stars <b>1</b>
        <p>Fork <b>2</b></p></Numeral
    >
</template>
