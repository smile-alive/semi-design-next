<script setup lang="ts">
    import { Resizable } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div :style="{ width: '500px', height: '60%' }">
        <Resizable :defaultSize="{ width: 200, height: 200 }" :ratio="2" :style="{ backgroundColor: 'var(--semi-grey-1)' }">
            <div :style="{ marginLeft: '20%' }">ratio=2</div>
        </Resizable>
    </div>
</template>
