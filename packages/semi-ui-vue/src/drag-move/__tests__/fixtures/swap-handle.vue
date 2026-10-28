<script setup lang="ts">
    import { ref } from 'vue';

    const key = ref('a');
</script>

<template>
    <div>
        <button type="button" @click="key = 'b'">swap</button>
        <span :key="key" data-testid="handle">handle</span>
    </div>
</template>
