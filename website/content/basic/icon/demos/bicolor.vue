<script setup lang="ts">
    import { IconAIFilledLevel2, IconAIWandLevel2 } from '@fibrae/semi-icons-vue';
</script>

<template>
    <div>
        <IconAIWandLevel2 :fill="['var(--semi-color-danger)', 'var(--semi-color-success)']" size="extra-large" style="margin-inline-end: 10px" />
        <IconAIFilledLevel2 fill="var(--semi-color-success)" size="extra-large" />
    </div>
</template>
