<script setup lang="ts">
    import AnchorLink from '../../anchor-link.vue';
    import Anchor from '../../anchor.vue';

    withDefaults(defineProps<{ wide?: boolean }>(), { wide: false });
</script>

<template>
    <Anchor :style="{ width: '160px' }">
        <AnchorLink href="#welcome" title="welcome" />
        <AnchorLink v-if="wide" href="#long" title="一行放不下、会在渲染时立即换行撑高列表的很长很长的标题" />
    </Anchor>
</template>
