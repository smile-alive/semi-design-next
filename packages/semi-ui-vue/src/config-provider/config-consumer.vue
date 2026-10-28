<script setup lang="ts">
    import type { ConfigConsumerSlots } from './interface';
    import useConfig from './use-config';

    defineOptions({ inheritAttrs: false });
    defineSlots<ConfigConsumerSlots>();

    const config = useConfig();
</script>

<template>
    <slot v-bind="config" />
</template>
