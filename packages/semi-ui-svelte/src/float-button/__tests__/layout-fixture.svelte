<script lang="ts">
    import FloatButtonGroup from '../float-button-group.svelte';
    import FloatButton from '../float-button.svelte';

    type Scene = 'sizes' | 'reset' | 'group' | 'compare' | 'disabled' | 'narrow' | 'keyboard';
    let { scene, log = [] }: { scene: Scene; log?: string[] } = $props();

    const narrowItems = [
        { content: '复制链接', value: 'copy' },
        { content: '回到顶部', value: 'top' },
        { content: '意见反馈', value: 'feedback' },
    ];
</script>

{#snippet icon()}<i>i</i>{/snippet}

{#if scene === 'sizes'}
    <div>
        <FloatButton {icon} size="small" style="bottom: 300px" />
        <FloatButton {icon} style="bottom: 200px" />
        <FloatButton badge={{ count: 5 }} {icon} shape="square" size="large" style="bottom: 100px" />
        <FloatButton badge={{ dot: true }} {icon} style="bottom: 20px" />
    </div>
{:else if scene === 'reset'}
    <FloatButton {icon} shape="square" />
{:else if scene === 'group'}
    <span data-testid="text-0" style="color: var(--semi-color-text-0)"></span>
    <FloatButtonGroup
        {icon}
        items={[
            { content: 'Editor', value: 'editor' },
            { content: 'Search', value: 'search' },
        ]}
    />
{:else if scene === 'compare'}
    <FloatButton aria-label="alone" colorful {icon} shape="square" size="large" />
    <FloatButtonGroup {icon} items={[{ shape: 'square', size: 'large', colorful: true, 'aria-label': 'grouped' }]} />
{:else if scene === 'disabled'}
    <span data-testid="disabled-text" style="color: var(--semi-color-disabled-text)"></span>
    <FloatButtonGroup disabled items={[{ content: 'Editor', value: 'editor' }]} />
{:else if scene === 'narrow'}
    <FloatButtonGroup {icon} items={narrowItems} style="width: 600px" />
    <FloatButtonGroup {icon} items={narrowItems} style="width: 120px" />
{:else}
    <button data-testid="start" type="button">start</button>
    <FloatButton aria-label="Edit" {icon} onclick={() => log.push('edit')} />
    <FloatButton aria-label="Off" disabled {icon} onclick={() => log.push('off')} />
    <FloatButton
        aria-label="Docs"
        href="#docs"
        onclick={(event) => {
            event.preventDefault();
            log.push('docs');
        }}
    />
    <FloatButtonGroup
        items={[
            { content: 'Editor', value: 'editor' },
            { content: 'Search', value: 'search', disabled: true },
            { content: 'Help', value: 'help' },
        ]}
        onClick={(value) => log.push(`group:${value}`)}
    />
{/if}
