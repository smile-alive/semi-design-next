<script setup lang="ts">
    import { ref } from 'vue';
    import { Input } from '@fibrae/semi-ui-vue';

    const value = ref('controlInput');

    const onChange = (val: string) => {
        console.log(val);
    };
</script>

<template>
    <Input v-model="value" aria-label="Controlled input" @change="onChange" />
</template>
