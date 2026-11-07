<script setup lang="ts">
    import AnchorLink from '../../anchor-link.vue';
    import Anchor from '../../anchor.vue';

    withDefaults(defineProps<{ autoCollapse?: boolean }>(), { autoCollapse: false });
</script>

<template>
    <Anchor :autoCollapse="autoCollapse">
        <AnchorLink href="#Semi Design" title="1. Semi Design">
            <AnchorLink href="#组件" title="1.1 组件">
                <AnchorLink href="#头像" title="1.1.1 Avatar" />
                <AnchorLink href="#按钮" title="1.1.2 Button" />
                <AnchorLink href="#图标" title="1.1.3 Icon" />
            </AnchorLink>
            <AnchorLink href="#物料" title="1.2 物料" />
            <AnchorLink href="#主题商店" title="1.3 主题商店" />
        </AnchorLink>
        <AnchorLink href="#设计语言" title="2. 设计语言" />
    </Anchor>
</template>
