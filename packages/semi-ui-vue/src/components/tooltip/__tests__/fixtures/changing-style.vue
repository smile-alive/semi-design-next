<script setup lang="ts">
    import { computed, shallowRef } from 'vue';

    defineOptions({ inheritAttrs: false });
    const changed = shallowRef(false);
    const style = computed(() => (changed.value ? 'background: blue; display: inline-block;' : 'background: red; display: inline-block;'));
</script>

<template>
    <span :style="style">
        <button type="button" @click.stop="changed = true">change style</button>
    </span>
</template>
