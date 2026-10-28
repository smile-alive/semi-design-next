<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import AnchorLink from '../../anchor-link.vue';
    import Anchor from '../../anchor.vue';

    withDefaults(defineProps<{ showBox?: boolean }>(), { showBox: false });
    const box = useTemplateRef('box');
    // Stable on purpose: an inline arrow would be a new prop on every render and update Anchor anyway.
    const getContainer = () => box.value;
</script>

<template>
    <Anchor :getContainer="getContainer">
        <AnchorLink href="#a" title="a" />
        <AnchorLink href="#b" title="b" />
    </Anchor>
    <div v-if="showBox" id="ref-box" ref="box">
        <h2 id="a">A</h2>
        <h2 id="b">B</h2>
    </div>
</template>
