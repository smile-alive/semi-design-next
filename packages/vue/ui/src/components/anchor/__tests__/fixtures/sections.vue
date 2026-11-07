<script setup lang="ts">
    import AnchorLink from '../../anchor-link.vue';
    import Anchor from '../../anchor.vue';

    defineOptions({ inheritAttrs: false });
    withDefaults(defineProps<{ links?: string[]; sections?: string[]; boxId?: string; showBox?: boolean; extraBoxes?: boolean }>(), { links: () => ['a', 'b'], sections: () => ['a', 'b'], boxId: undefined, showBox: true, extraBoxes: false });
</script>

<template>
    <Anchor v-bind="$attrs">
        <AnchorLink v-for="id in links" :key="id" :href="`#${id}`" :title="id" />
    </Anchor>
    <template v-if="extraBoxes">
        <div id="one" />
        <div id="two" />
    </template>
    <div v-if="boxId && showBox" :id="boxId">
        <h2 v-for="id in sections" :id="id" :key="id">{{ id.toUpperCase() }}</h2>
    </div>
    <template v-else-if="!boxId">
        <h2 v-for="id in sections" :id="id" :key="id">{{ id.toUpperCase() }}</h2>
    </template>
</template>
