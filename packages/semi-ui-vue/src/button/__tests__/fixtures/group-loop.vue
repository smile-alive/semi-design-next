<script setup lang="ts">
    import ButtonGroup from '../../button-group.vue';
    import Button from '../../index';

    withDefaults(defineProps<{ disabled?: boolean; items?: string[]; showLast?: boolean }>(), {
        disabled: undefined,
        items: () => [],
        showLast: true,
    });
</script>

<template>
    <ButtonGroup :disabled="disabled">
        <Button v-if="false">hidden</Button>
        <Button v-for="item in []" :key="item">none</Button>
        {{ 1 }}
        <Button>查询</Button>
        <Button>剪切</Button>
        <Button v-for="item in items" :key="item">{{ item }}</Button>
        <Button v-if="showLast">last</Button>
    </ButtonGroup>
</template>
