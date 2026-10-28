<script setup lang="ts">
    import Text from '../../text.vue';

    const code = 'code';
</script>

<template>
    <Text :copyable="{ content: code }" :ellipsis="{ showTooltip: { opts: { style: { wordBreak: 'break-word' } } } }" :style="{ marginTop: '6px', color: 'var(--semi-color-text-2)' }"> Key: {{ code }} </Text>
</template>
