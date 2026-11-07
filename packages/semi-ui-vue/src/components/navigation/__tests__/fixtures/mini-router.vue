<script setup lang="ts">
    import { computed, ref, watch } from 'vue';
    import Nav, { NavItem, type NavItemConfig } from '../..';

    const sections: Record<string, NavItemConfig & { itemKey: string; text: string }> = {
        config: {
            itemKey: '/config',
            text: 'Config',
            items: [
                {
                    itemKey: '/config/ability',
                    text: 'Ability',
                    items: [{ itemKey: '/config/ability/management', text: 'Ability management' }],
                },
                {
                    itemKey: '/config/task',
                    text: 'Task',
                    items: [{ itemKey: '/config/task/management', text: 'Word management' }],
                },
            ],
        },
        distribution: {
            itemKey: '/distribution',
            text: 'Distribution',
            items: [
                {
                    itemKey: '/distribution/queue',
                    text: 'Queue',
                    items: [{ itemKey: '/distribution/queue/management', text: 'Config management' }],
                },
            ],
        },
    };
    const redirects: Record<string, string> = {
        '/config': '/config/ability/management',
        '/distribution': '/distribution/queue/management',
    };

    const path = ref('/');
    watch(
        path,
        (value) => {
            if (redirects[value]) path.value = redirects[value];
        },
        { flush: 'post' }
    );
    const section = computed(() => path.value.split('/')[1]);
</script>

<template>
    <Nav mode="horizontal" :selectedKeys="[`/${section}`]">
        <NavItem v-for="option in Object.values(sections)" :key="option.itemKey" :itemKey="option.itemKey" :text="option.text" @click="path = option.itemKey" />
    </Nav>
    <Nav :items="sections[section]?.items ?? []" :selectedKeys="[path]" />
</template>
