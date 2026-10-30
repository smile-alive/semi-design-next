<script lang="ts">
    import { Button, Collapsible } from '@fibrae/semi-ui-svelte';

    let isOpen = $state(false);

    const maskStyle = $derived(isOpen ? undefined : '-webkit-mask-image: linear-gradient(to bottom, black 0%, rgba(0, 0, 0, 1) 60%, rgba(0, 0, 0, 0.2) 80%, transparent 100%)');
    const linkStyle = 'position: absolute; left: 0; right: 0; width: 100%; padding: 0; border: none; background: none; font-size: inherit; font-family: inherit; line-height: inherit; text-align: center; bottom: -10px; font-weight: 700; cursor: pointer; color: var(--semi-color-link)';
</script>

<Button aria-controls="collapsible-height" aria-expanded={isOpen} onclick={() => (isOpen = !isOpen)}>Toggle</Button>
<div style="position: relative">
    <Collapsible collapseHeight={60} id="collapsible-height" {isOpen} style={maskStyle}>
        <ul>
            <li>
                <p>Semi Design 以内容优先进行设计。</p>
            </li>
            <li>
                <p>更容易地自定义主题。</p>
            </li>
            <li>
                <p>适用国际化场景。</p>
            </li>
            <li>
                <p>效率场景加入人性化关怀。</p>
            </li>
        </ul>
    </Collapsible>
    {#if !isOpen}
        <button aria-controls="collapsible-height" aria-expanded={isOpen} style={linkStyle} type="button" onclick={() => (isOpen = !isOpen)}>+ Show More</button>
    {/if}
</div>
