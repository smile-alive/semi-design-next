<script setup lang="ts">
    import { Progress } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div :style="{ width: '240px' }">
        <Progress aria-label="正在加载" indeterminate />
        <br />
        <Progress aria-label="正在加载" indeterminate size="large" />
        <div :style="{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '20px' }">
            <Progress aria-label="正在加载" indeterminate type="circle" />
            <Progress aria-label="正在加载" indeterminate size="small" type="circle" />
        </div>
    </div>
</template>
