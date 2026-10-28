<script setup lang="ts">
    import { Resizable } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div :style="{ width: '500px', height: '60%' }">
        <Resizable :defaultSize="{ width: 100, height: 100 }" :maxHeight="300" :maxWidth="200" :minHeight="50" :minWidth="50" :style="{ backgroundColor: 'var(--semi-grey-1)' }">
            <div :style="{ marginLeft: '20%' }">width在50到200之间，height在50到300之间</div>
        </Resizable>
    </div>
</template>
