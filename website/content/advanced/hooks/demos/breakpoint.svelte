<script lang="ts">
    import { Space, Tag } from '@fibrae/semi-ui-svelte';
    import { useBreakpoint } from '@fibrae/semi-ui-svelte/hooks';

    const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;

    const breakpoint = useBreakpoint();
</script>

<Space>
    {#each breakpoints as name (name)}
        <Tag color={breakpoint.screens[name] ? 'green' : 'grey'}>{name}</Tag>
    {/each}
</Space>
