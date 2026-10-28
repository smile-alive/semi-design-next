<script setup lang="ts">
    import { Input } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Input aria-label="域名">
        <template #addonBefore>http://</template>
        <template #addonAfter>.com</template>
    </Input>
</template>
