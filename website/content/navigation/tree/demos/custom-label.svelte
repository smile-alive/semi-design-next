<script lang="ts">
    import { Tag, Tree } from '@fibrae/semi-ui-svelte';

    // Node content is display-only: focus stays on the tree, so buttons and links inside are keyboard-unreachable
    const treeData = [
        {
            label: '亚洲',
            value: 'yazhou',
            key: 'yazhou',
            children: [
                {
                    label: '中国',
                    value: 'zhongguo',
                    key: 'zhongguo',
                },
                {
                    label: '日本',
                    value: 'riben',
                    key: 'riben',
                },
            ],
        },
    ];
    const labelStyle = 'display: flex; justify-content: space-between; align-items: center';
    const treeStyle = 'width: 260px; height: 420px; border: 1px solid var(--semi-color-border)';
</script>

<Tree style={treeStyle} {treeData}>
    {#snippet label({ item, label })}
        <div style={labelStyle}>
            <span>{label}</span>
            <Tag size="small">{item.children ? '大洲' : '国家'}</Tag>
        </div>
    {/snippet}
</Tree>
