<script setup lang="ts">
    import AnchorLink from '../../anchor-link.vue';
    import Anchor from '../../anchor.vue';

    defineOptions({ inheritAttrs: false });
</script>

<template>
    <Anchor v-bind="$attrs">
        <AnchorLink href="#welcome" title="welcome" />
        <AnchorLink href="#api" title="api too much to show">
            <AnchorLink href="#docs" title="docs">
                <AnchorLink href="#doc1" title="doc1" />
                <AnchorLink href="#doc2" title="doc2" />
            </AnchorLink>
        </AnchorLink>
        <AnchorLink href="#contact" title="contact" />
    </Anchor>
</template>
