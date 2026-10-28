<script setup lang="ts">
    import { IconArrowUp } from '@fibrae/semi-icons-vue';
    import { BackTop } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <span>向下滚动，右下角会出现一个方形的多彩按钮。</span>
        <BackTop aria-label="回到顶部" colorful shape="square" size="large" style="bottom: 100px">
            <template #icon>
                <IconArrowUp />
            </template>
        </BackTop>
    </div>
</template>
