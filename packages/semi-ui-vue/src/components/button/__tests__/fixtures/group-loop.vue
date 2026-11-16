<script setup lang="ts">
    import ButtonGroup from '../../button-group.vue';
    import Button from '../../index';

    const props = withDefaults(defineProps<{ disabled?: boolean; items?: string[]; showLast?: boolean }>(), {
        disabled: undefined,
        items: () => [],
        showLast: true,
    });
</script>

<template>
    <ButtonGroup :disabled="props.disabled">
        <Button v-if="false">hidden</Button>
        <Button v-for="item in []" :key="item">none</Button>
        {{ 1 }}
        <Button>查询</Button>
        <Button>剪切</Button>
        <Button v-for="item in props.items" :key="item">{{ item }}</Button>
        <Button v-if="props.showLast">last</Button>
    </ButtonGroup>
</template>
