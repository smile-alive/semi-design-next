<script setup lang="ts">
    import { providePopupLayer } from './popup-layer';

    providePopupLayer(Symbol('semi-popup-layer'));
</script>

<template>
    <slot />
</template>
