<script setup lang="ts">
    import { shallowRef } from 'vue';

    const replaced = shallowRef(false);
</script>

<template>
    <span v-if="!replaced">
        <button type="button" @click.stop="replaced = true">replace root</button>
    </span>
    <button v-else type="button">replacement trigger</button>
</template>
