<script setup lang="ts">
    import SplitTagGroup from '../../split-tag-group.vue';
    import Tag from '../../tag.vue';

    const props = withDefaults(defineProps<{ count?: number }>(), { count: 2 });
</script>

<template>
    <SplitTagGroup>
        <Tag v-for="item in props.count" :key="item">{{ item }}</Tag>
    </SplitTagGroup>
</template>
