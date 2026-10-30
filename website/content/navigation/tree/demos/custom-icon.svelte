<script lang="ts">
    import { IconMapPin } from '@fibrae/semi-icons-svelte';
    import { Tree } from '@fibrae/semi-ui-svelte';

    const treeData = [
        {
            label: 'Asia',
            value: 'Asia',
            key: '0',
            children: [
                {
                    label: 'China',
                    value: 'China',
                    key: '0-0',
                },
                {
                    label: 'Japan',
                    value: 'Japan',
                    key: '0-1',
                },
            ],
        },
    ];
    const style = 'width: 260px; height: 420px; border: 1px solid var(--semi-color-border)';
</script>

<Tree {style} {treeData}>
    {#snippet icon()}
        <IconMapPin style="color: var(--semi-color-text-2)" />
    {/snippet}
</Tree>
