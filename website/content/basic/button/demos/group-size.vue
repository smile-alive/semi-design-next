<script setup lang="ts">
    import { Button, ButtonGroup } from '@fibrae/semi-ui-vue';

    const sizes = ['large', 'default', 'small'] as const;
</script>

<template>
    <div :style="{ display: 'flex' }">
        <div v-for="size in sizes" :key="size" :style="{ marginRight: '10px' }">
            <ButtonGroup aria-label="操作按钮组" :size="size">
                <Button>拷贝</Button>
                <Button>查询</Button>
                <Button>剪切</Button>
            </ButtonGroup>
        </div>
    </div>
</template>
