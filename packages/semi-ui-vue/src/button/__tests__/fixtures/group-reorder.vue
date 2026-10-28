<script setup lang="ts">
    import ButtonGroup from '../../button-group.vue';
    import Button from '../../index';

    defineProps<{ order: string[] }>();
</script>

<template>
    <ButtonGroup>
        <Button v-for="name in order" :key="name">{{ name }}</Button>
    </ButtonGroup>
</template>
