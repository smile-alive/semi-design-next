<script setup lang="ts">
    import { ref } from 'vue';
    import { ScrollItem } from '../..';

    const index = ref(0);
    const list = [{ value: 'a' }, { value: 'b' }, { value: 'c' }];
</script>

<template>
    <ScrollItem v-model:selectedIndex="index" aria-label="letters" :list="list" mode="normal" />
    <span data-testid="value">{{ index }}</span>
</template>
