<script setup lang="ts">
    import { ref } from 'vue';
    import { Typography } from '@fibrae/semi-ui-vue';
    import { useHotKeys } from '@fibrae/semi-ui-vue/composables';

    const count = ref(0);
    useHotKeys(
        () => ['Control', 'k'],
        () => (count.value += 1),
        () => ({ preventDefault: true })
    );
</script>

<template>
    <Typography.Text>按下 Ctrl + K 的次数：{{ count }}</Typography.Text>
</template>
