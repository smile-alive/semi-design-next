<script lang="ts">
    import { IconChevronDown, IconMinus, IconPlus } from '@fibrae/semi-icons-svelte';
    import { Tree } from '@fibrae/semi-ui-svelte';

    const treeData = [
        {
            label: '亚洲',
            key: 'yazhou',
            children: [
                {
                    label: '中国',
                    key: 'zhongguo',
                    children: [
                        {
                            label: '北京',
                            key: 'beijing',
                        },
                        {
                            label: '上海',
                            key: 'shanghai',
                        },
                    ],
                },
                {
                    label: '日本',
                    key: 'riben',
                },
            ],
        },
        {
            label: '北美洲',
            key: 'beimeizhou',
        },
    ];
    const style = 'width: 260px; height: 200px; border: 1px solid var(--semi-color-border)';
</script>

<p>expandIcon 是固定的图标</p>
<Tree expandedKeys={['yazhou']} multiple {style} {treeData}>
    {#snippet expandIcon()}
        <IconChevronDown class="testCls" size="small" />
    {/snippet}
</Tree>
<br />
<p>expandIcon 随展开状态变化</p>
<Tree expandedKeys={['yazhou']} multiple {style} {treeData}>
    {#snippet expandIcon({ expanded, onClick, class: className })}
        {#if expanded}
            <IconMinus class={className} size="small" onclick={onClick} />
        {:else}
            <IconPlus class={className} size="small" onclick={onClick} />
        {/if}
    {/snippet}
</Tree>
