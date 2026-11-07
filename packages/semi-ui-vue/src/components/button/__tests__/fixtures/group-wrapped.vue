<script setup lang="ts">
    import Tooltip from '../../../tooltip';
    import ButtonGroup from '../../button-group.vue';
    import Button from '../../index';
    import Inner from './inner-button.vue';
</script>

<template>
    <ButtonGroup disabled type="danger">
        <span data-testid="plain">plain</span>
        <Tooltip :motion="false">
            <Button>tip</Button>
            <template #content>tip content</template>
        </Tooltip>
        <Inner />
        <ButtonGroup type="warning">
            <Button>nested</Button>
            <Button type="secondary">own</Button>
        </ButtonGroup>
    </ButtonGroup>
</template>
