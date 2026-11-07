<script setup lang="ts">
    import Input, { InputGroup } from '../..';
</script>

<template>
    <InputGroup class="g" :label="{ text: 'Score' }" labelPosition="top" style="color: red">
        <Input placeholder="score" />
    </InputGroup>
    <InputGroup labelPosition="left">
        <template #label>Slot label</template>
        <template #labelExtra>extra</template>
        <Input placeholder="slot" />
    </InputGroup>
</template>
