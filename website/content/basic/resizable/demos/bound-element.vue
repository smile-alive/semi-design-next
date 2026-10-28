<script setup lang="ts">
    import { Resizable } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div :style="{ width: '300px', height: '300px', border: 'var(--semi-color-border) 1px solid' }">
        <Resizable boundElement="parent" :defaultSize="{ width: '60%', height: 200 }" :style="{ marginLeft: '20%', backgroundColor: 'var(--semi-grey-1)' }">
            <div :style="{ marginLeft: '20%' }">bound：parent</div>
        </Resizable>
    </div>
</template>
