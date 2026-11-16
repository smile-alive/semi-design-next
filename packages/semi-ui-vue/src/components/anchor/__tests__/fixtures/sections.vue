<script setup lang="ts">
    import AnchorLink from '../../anchor-link.vue';
    import Anchor from '../../anchor.vue';

    defineOptions({ inheritAttrs: false });
    const props = withDefaults(defineProps<{ links?: string[]; sections?: string[]; boxId?: string; showBox?: boolean; extraBoxes?: boolean }>(), { links: () => ['a', 'b'], sections: () => ['a', 'b'], boxId: undefined, showBox: true, extraBoxes: false });
</script>

<template>
    <Anchor v-bind="$attrs">
        <AnchorLink v-for="id in props.links" :key="id" :href="`#${id}`" :title="id" />
    </Anchor>
    <template v-if="props.extraBoxes">
        <div id="one" />
        <div id="two" />
    </template>
    <div v-if="props.boxId && props.showBox" :id="props.boxId">
        <h2 v-for="id in props.sections" :id="id" :key="id">{{ id.toUpperCase() }}</h2>
    </div>
    <template v-else-if="!props.boxId">
        <h2 v-for="id in props.sections" :id="id" :key="id">{{ id.toUpperCase() }}</h2>
    </template>
</template>
