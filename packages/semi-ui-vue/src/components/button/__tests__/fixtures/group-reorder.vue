<script setup lang="ts">
    import ButtonGroup from '../../button-group.vue';
    import Button from '../../index';

    const props = defineProps<{ order: string[] }>();
</script>

<template>
    <ButtonGroup>
        <Button v-for="name in props.order" :key="name">{{ name }}</Button>
    </ButtonGroup>
</template>
