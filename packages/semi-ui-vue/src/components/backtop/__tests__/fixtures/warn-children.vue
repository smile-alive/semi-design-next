<script setup lang="ts">
    import BackTop from '../../backtop.vue';

    const props = defineProps<{ kind: 'plain' | 'link' | 'switch' }>();
</script>

<template>
    <BackTop :visibilityHeight="-1">
        <span v-if="props.kind === 'plain'">UP</span>
        <a v-else-if="props.kind === 'link'" href="#top">UP</a>
        <span v-else aria-checked="false" role="switch">UP</span>
    </BackTop>
</template>
