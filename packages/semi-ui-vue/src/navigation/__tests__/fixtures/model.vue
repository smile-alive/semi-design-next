<script setup lang="ts">
    import { ref } from 'vue';
    import Nav, { type ItemKey, type NavItems } from '../..';

    defineOptions({ inheritAttrs: false });
    const props = defineProps<{ items: NavItems; open: ItemKey[]; selected: ItemKey[] } & /* @vue-ignore */ InstanceType<typeof Nav>['$props']>();
    const openKeys = ref(props.open);
    const selectedKeys = ref(props.selected);
    const isCollapsed = ref(false);
</script>

<template>
    <Nav v-model:isCollapsed="isCollapsed" v-model:openKeys="openKeys" v-model:selectedKeys="selectedKeys" v-bind="$attrs" :footer="{ collapseButton: true }" :items="props.items" />
    <pre data-testid="model">{{ JSON.stringify({ openKeys, selectedKeys, isCollapsed }) }}</pre>
</template>
