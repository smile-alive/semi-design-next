<script setup lang="ts">
    import { shallowRef } from 'vue';
    import MCPConfigure, { type MCPConfigureOption } from '../../mcp-configure';

    const options = shallowRef<MCPConfigureOption[]>([
        { label: 'GitHub', value: 'github', active: true },
        { label: 'Figma', value: 'figma' },
    ]);
</script>

<template>
    <MCPConfigure v-model:options="options" visible />
</template>
