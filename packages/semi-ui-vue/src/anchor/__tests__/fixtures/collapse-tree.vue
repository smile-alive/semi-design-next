<script setup lang="ts">
    import AnchorLink from '../../anchor-link.vue';
    import Anchor from '../../anchor.vue';
</script>

<template>
    <Anchor autoCollapse defaultAnchor="#g1">
        <AnchorLink href="#p1" title="p1">
            <AnchorLink href="#c1" title="c1">
                <AnchorLink href="#g1" title="g1" />
                <AnchorLink href="#g2" title="g2" />
            </AnchorLink>
            <AnchorLink href="#c2" title="c2" />
        </AnchorLink>
        <AnchorLink href="#p2" title="p2">
            <AnchorLink href="#d1" title="d1" />
            <AnchorLink href="#d2" title="d2" />
        </AnchorLink>
    </Anchor>
</template>
