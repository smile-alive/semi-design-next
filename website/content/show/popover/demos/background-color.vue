<script setup lang="ts">
    import { Popover, Tag } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Popover
            aria-label="Colorful Popover"
            position="right"
            showArrow
            :style="{
                backgroundColor: 'var(--semi-blue-6)',
                borderColor: 'var(--semi-blue-6)',
                color: 'var(--semi-color-white)',
                borderWidth: '1px',
                borderStyle: 'solid',
            }"
            trigger="custom"
            visible
        >
            <Tag :style="{ backgroundColor: 'var(--semi-blue-6)', color: 'var(--semi-color-white)' }"> Colorful Popover </Tag>
            <template #content>
                <article :style="{ padding: '4px' }">Hi, Semi UI Popover.</article>
            </template>
        </Popover>
    </div>
</template>
