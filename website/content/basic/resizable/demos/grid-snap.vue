<script setup lang="ts">
    import { Resizable } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div :style="{ width: '500px', height: '60%' }">
        <Resizable
            :defaultSize="{ width: '60%', height: 300 }"
            :grid="[100, 100]"
            :snapGap="20"
            :style="{
                marginLeft: '20%',
                backgroundColor: 'var(--semi-grey-1)',
                border: 'var(--semi-color-border) 1px solid',
            }"
        >
            <div :style="{ marginLeft: '20%' }">snap</div>
        </Resizable>
    </div>
</template>
