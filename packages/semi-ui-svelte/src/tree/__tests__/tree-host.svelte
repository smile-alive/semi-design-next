<script lang="ts">
    import en_US from '@fibrae/semi-foundation/locale/source/en_US';
    import ConfigProvider from '../../config-provider/config-provider.svelte';
    import type { TreeProps } from '../interface';
    import Tree from '../tree.svelte';

    // `props` is a $state store: a test changes its fields to re-render the tree
    let { props, direction }: { props: TreeProps; direction?: 'ltr' | 'rtl' } = $props();

    let tree = $state<ReturnType<typeof Tree>>();

    export function handle() {
        if (!tree) {
            throw new Error('Tree is not mounted');
        }
        return tree;
    }
</script>

<ConfigProvider {direction} locale={en_US}>
    <Tree bind:this={tree} {...props} />
</ConfigProvider>
