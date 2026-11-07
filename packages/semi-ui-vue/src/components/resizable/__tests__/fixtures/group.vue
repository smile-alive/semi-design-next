<script setup lang="ts">
    import { ResizeGroup, ResizeHandler, ResizeItem } from '../..';

    const props = withDefaults(
        defineProps<{
            direction?: 'horizontal' | 'vertical';
            items?: Record<string, unknown>[];
            handler?: Record<string, unknown>;
            width?: string;
            height?: string;
        }>(),
        { direction: undefined, items: () => [{}, {}], handler: () => ({}), width: '1010px', height: '500px' }
    );
</script>

<template>
    <div :style="{ width: props.width, height: props.height }">
        <ResizeGroup class="custom" data-testid="group" :direction="props.direction">
            <template v-for="(item, i) in props.items" :key="i">
                <ResizeHandler v-if="i > 0" v-bind="props.handler" />
                <ResizeItem v-bind="item">item {{ i }}</ResizeItem>
            </template>
        </ResizeGroup>
    </div>
</template>
