<script lang="ts">
    import { Button, Tabs, type PlainTab } from '@fibrae/semi-ui-svelte';

    let count = $state(8);
    const tabList = $derived<PlainTab[]>(Array.from({ length: count }, (_, i) => ({ itemKey: `${i}`, tab: `Tab-${i + 1}` })));

    const boxStyle = 'border: 1px solid var(--semi-color-border); padding: 12px';
    const noteStyle = 'margin-bottom: 8px; color: var(--semi-color-text-2); font-size: 12px';
</script>

{#snippet panel({ index }: { index: number })}Content of Tab {index + 1}{/snippet}

<div>
    <div style="margin-bottom: 12px">
        <Button style="margin-right: 8px" onclick={() => (count = Math.max(3, count - 2))}>减少 Tab</Button>
        <Button onclick={() => (count = Math.min(15, count + 2))}>增加 Tab</Button>
        <span style="margin-left: 12px">当前 Tab 数量: {count}</span>
    </div>

    <div style={`${boxStyle}; margin-bottom: 16px`}>
        <p style={noteStyle}>collapsible="auto" - 自动检测溢出</p>
        <Tabs collapsible="auto" {panel} {tabList} type="card" />
    </div>

    <div style={`${boxStyle}; max-width: 400px`}>
        <p style={noteStyle}>固定宽度 400px，测试较窄容器</p>
        <Tabs collapsible="auto" {panel} {tabList} type="card" />
    </div>
</div>
