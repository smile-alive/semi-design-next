<script setup lang="ts">
    import { Button, ButtonGroup } from '@fibrae/semi-ui-vue';

    const types = ['primary', 'secondary', 'tertiary', 'warning', 'danger'] as const;
</script>

<template>
    <div :style="{ display: 'flex' }">
        <div v-for="type in types" :key="type" :style="{ marginRight: '10px' }">
            <ButtonGroup aria-label="操作按钮组" :type="type">
                <Button>拷贝</Button>
                <Button>查询</Button>
                <Button>剪切</Button>
            </ButtonGroup>
        </div>
    </div>
</template>
