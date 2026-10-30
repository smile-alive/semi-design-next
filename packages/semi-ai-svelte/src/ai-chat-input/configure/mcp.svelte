<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
    import { Button } from '@fibrae/semi-ui-svelte/button/index';
    import { Dropdown, DropdownItem, DropdownMenu } from '@fibrae/semi-ui-svelte/dropdown/index';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import type { McpProps } from './interface.js';

    let { options, num, showConfigure = true, onConfigureButtonClick, children, optionIcon, class: className, ...rest }: McpProps = $props();

    const locale = useLocale('AIChatInput');

    const prefix = cssClasses.PREFIX;
    const count = $derived(num ?? options.length);
</script>

{#snippet content()}
    <div class={`${prefix}-footer-configure-mcp-header`}>
        <span class={`${prefix}-footer-configure-mcp-header-title`}>
            {locale().locale.selected.replace('${count}', String(count))}
        </span>
        {#if showConfigure}
            <Button class={`${prefix}-footer-configure-mcp-header-config`} theme="outline" onclick={() => onConfigureButtonClick?.()}>
                {locale().locale.configure}
            </Button>
        {/if}
    </div>
    {#if children}
        {@render children()}
    {:else}
        <DropdownMenu>
            {#each options as item, index (item.value)}
                {#if optionIcon}
                    <DropdownItem disabled={item.disabled}>
                        {#snippet icon()}
                            {@render optionIcon({ item, index })}
                        {/snippet}
                        {item.label}
                    </DropdownItem>
                {:else}
                    <DropdownItem disabled={item.disabled}>{item.label}</DropdownItem>
                {/if}
            {/each}
        </DropdownMenu>
    {/if}
{/snippet}

<Dropdown {...rest} class={className ? `${prefix}-footer-configure-mcp ${className}` : `${prefix}-footer-configure-mcp`} {content}>
    {#snippet child({ props })}
        <!-- the click must not reach the container, whose click handler would move focus to the editor -->
        <Button {...props} class={[props.class, `${prefix}-footer-configure-mcp-trigger`]} theme="outline" type="tertiary" onclick={(event) => event.stopPropagation()}>
            MCP · {count}
        </Button>
    {/snippet}
</Dropdown>
