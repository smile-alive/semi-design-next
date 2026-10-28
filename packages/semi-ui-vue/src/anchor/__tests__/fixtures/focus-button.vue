<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import AnchorLink from '../../anchor-link.vue';
    import Anchor from '../../anchor.vue';

    const emit = defineEmits<{ confirm: [] }>();
    const button = useTemplateRef('button');
</script>

<template>
    <Anchor @click="button?.focus()">
        <AnchorLink href="#nowhere" title="Section A" />
    </Anchor>
    <button ref="button" type="button" @click="emit('confirm')">confirm</button>
</template>
