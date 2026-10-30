<script lang="ts">
    import { Tree, TypographyText } from '@fibrae/semi-ui-svelte';

    const treeData = [
        {
            label: '亚洲亚洲亚洲亚洲亚洲亚洲亚洲亚洲亚洲亚洲亚洲亚洲',
            value: 'yazhou',
            key: 'yazhou',
            children: [
                {
                    label: '中国中国中国中国中国中国中国中国中国中国中国中国',
                    value: 'zhongguo',
                    key: 'zhongguo',
                },
                {
                    label: '日本日本日本日本日本日本日本日本日本日本日本日本',
                    value: 'riben',
                    key: 'riben',
                },
            ],
        },
    ];
    const treeStyle = 'width: 260px; height: 420px; border: 1px solid var(--semi-color-border)';
</script>

<Tree style={treeStyle} {treeData}>
    {#snippet label({ label })}
        <TypographyText ellipsis={{ showTooltip: true }} style="width: 100%">{label}</TypographyText>
    {/snippet}
</Tree>
