<script setup lang="ts">
    import { Anchor } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Anchor :offsetTop="100" position="right" showTooltip :targetOffset="60">
            <Anchor.Link href="#工具提示位置" title="工具提示是一个有用的工具，它可以在文字缩略时展示全部内容。" />
            <Anchor.Link href="#组件" title="组件" />
            <Anchor.Link href="#设计语言" title="设计语言" />
            <Anchor.Link href="#物料平台" title="物料平台" />
            <Anchor.Link href="#主题商店" title="主题商店" />
        </Anchor>
    </div>
</template>
