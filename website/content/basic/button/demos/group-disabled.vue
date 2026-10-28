<script setup lang="ts">
    import { Button, ButtonGroup } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div :style="{ display: 'flex' }">
        <div :style="{ marginRight: '10px' }">
            <ButtonGroup disabled>
                <Button>拷贝</Button>
                <Button>查询</Button>
                <Button>剪切</Button>
            </ButtonGroup>
        </div>
    </div>
</template>
