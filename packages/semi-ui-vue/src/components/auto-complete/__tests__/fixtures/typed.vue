<script setup lang="ts">
    import AutoComplete from '../..';

    const people = [{ value: 'a', label: 'A', email: 'a@semi.design' }];
</script>

<template>
    <AutoComplete aria-label="people" :data="people" :renderSelectedItem="(option) => option.email">
        <template #item="{ item }">{{ item.email.toUpperCase() }}</template>
    </AutoComplete>
</template>
