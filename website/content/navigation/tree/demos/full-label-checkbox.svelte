<script lang="ts">
    import { Checkbox, Tree } from '@fibrae/semi-ui-svelte';

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
                    children: [
                        {
                            label: 'Beijing',
                            value: 'Beijing',
                            key: '0-0-0',
                        },
                        {
                            label: 'Shanghai',
                            value: 'Shanghai',
                            key: '0-0-1',
                        },
                    ],
                },
                {
                    label: 'Japan',
                    value: 'Japan',
                    key: '0-1',
                    children: [
                        {
                            label: 'Osaka',
                            value: 'Osaka',
                            key: '0-1-0',
                        },
                    ],
                },
            ],
        },
        {
            label: 'North America',
            value: 'North America',
            key: '1',
            children: [
                {
                    label: 'United States',
                    value: 'United States',
                    key: '1-0',
                },
                {
                    label: 'Canada',
                    value: 'Canada',
                    key: '1-1',
                },
            ],
        },
    ];

    const treeStyle = 'width: 260px; height: 420px; border: 1px solid var(--semi-color-border)';
</script>

<Tree leafOnly multiple style={treeStyle} {treeData}>
    <!-- Focus stays on the tree (arrows expand, Enter/Space check), so the inline checkbox is display-only -->
    {#snippet fullLabel(row)}
        <div class={row.class} role="presentation" onclick={row.data.children?.length ? row.onExpand : row.onCheck}>
            {#if row.data.children?.length}
                {@render row.expandIcon()}
            {:else}
                <Checkbox aria-hidden="true" checked={row.checkStatus.checked} indeterminate={row.checkStatus.halfChecked} style="margin-right: 8px" tabindex={-1} />
            {/if}
            <span>{row.data.label}</span>
        </div>
    {/snippet}
</Tree>
