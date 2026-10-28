<script setup lang="ts">
    import AIChatInput from '../../index';

    const props = defineProps<{ shown: boolean; suggestions?: string[] }>();
</script>

<template>
    <KeepAlive>
        <AIChatInput v-if="props.shown" :suggestions="props.suggestions" />
        <span v-else>other</span>
    </KeepAlive>
</template>
