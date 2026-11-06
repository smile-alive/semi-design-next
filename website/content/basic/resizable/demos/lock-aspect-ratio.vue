<script setup lang="ts">
    import { Resizable } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div :style="{ width: '500px', height: '60%' }">
        <Resizable :defaultSize="{ width: 400, height: 300 }" lockAspectRatio :style="{ backgroundColor: 'var(--semi-grey-1)', marginBlockEnd: '10px' }">
            <div :style="{ marginInlineStart: '20%' }">lock</div>
        </Resizable>
        <Resizable :defaultSize="{ width: 200, height: (200 * 9) / 16 }" :lockAspectRatio="16 / 9" :style="{ backgroundColor: 'var(--semi-grey-1)' }">
            <div :style="{ marginInlineStart: '20%' }">16 / 9</div>
        </Resizable>
    </div>
</template>
