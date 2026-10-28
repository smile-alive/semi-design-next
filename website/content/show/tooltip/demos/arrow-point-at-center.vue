<script setup lang="ts">
    import { Button, Tooltip } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Tooltip position="topLeft">
            <Button :style="{ marginRight: '8px' }" type="secondary">指向元素中心</Button>
            <template #content>semi design tooltip</template>
        </Tooltip>
    </div>

    <div :style="{ marginTop: '20px' }">
        <Tooltip :arrowPointAtCenter="false" position="topLeft">
            <Button :style="{ marginRight: '8px', width: '120px' }" type="secondary">边缘对齐</Button>
            <template #content>semi design tooltip</template>
        </Tooltip>
    </div>
</template>
