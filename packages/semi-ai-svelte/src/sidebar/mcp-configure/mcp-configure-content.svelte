<script lang="ts">
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/sidebar/constants';
    import MCPConfigureContentFoundation, { type MCPConfigureContentAdapter, type MCPConfigureContentProps as FoundationProps, type MCPConfigureContentState, type MCPConfigureMode, type MCPOption } from '@fibrae/semi-ai-foundation/sidebar/mcp-cof-content-foundation';
    import { getShowOptions } from '@fibrae/semi-ai-foundation/sidebar/utils';
    import { cssClasses as buttonClasses } from '@fibrae/semi-foundation/button/constants';
    import { IconEdit, IconMinus, IconPlus, IconSearch, IconSetting } from '@fibrae/semi-icons-svelte';
    import { IllustrationNoContent, IllustrationNoContentDark } from '@fibrae/semi-illustrations-svelte';
    import useFoundation from '@fibrae/semi-ui-svelte/_base/use-foundation.svelte.js';
    import Button from '@fibrae/semi-ui-svelte/button/button.svelte';
    import Empty from '@fibrae/semi-ui-svelte/empty/empty.svelte';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import Input from '@fibrae/semi-ui-svelte/input/input.svelte';
    import RadioGroup from '@fibrae/semi-ui-svelte/radio/radio-group.svelte';
    import Radio from '@fibrae/semi-ui-svelte/radio/radio.svelte';
    import Tooltip from '@fibrae/semi-ui-svelte/tooltip/tooltip.svelte';
    import type { MCPConfigureContentProps, MCPConfigureOption } from './interface.js';

    type Foundation = MCPConfigureContentFoundation<MouseEvent>;
    type Adapter = MCPConfigureContentAdapter<MouseEvent>;

    // No fallback on the bindables: a bound `undefined` would throw with one
    let { options = $bindable(), customOptions = $bindable(), filter, placeholder, onStatusChange, onSearch, onAddClick, onConfigureClick, onEditClick, icon, desc, item }: MCPConfigureContentProps = $props();

    const locale = useLocale('Sidebar');

    const innerList = $derived(options ?? []);
    const customList = $derived(customOptions ?? []);

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: FoundationProps = {
        get options() {
            return innerList;
        },
        get customOptions() {
            return customList;
        },
        get filter() {
            return filter;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, FoundationProps, MCPConfigureContentState>(
        MCPConfigureContentFoundation,
        foundationProps,
        () => ({ mode: strings.MCP_MODE.INNER, inputValue: '', query: '' }),
        () => ({
            notifyConfigureClick: (event, option) => onConfigureClick?.(event, option as MCPConfigureOption),
            notifyEditClick: (event, option) => onEditClick?.(event, option as MCPConfigureOption),
            notifyStatusChange: (switched, custom) => {
                const list = switched as MCPConfigureOption[];
                // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides locally
                if (custom) {
                    customOptions = list;
                } else {
                    options = list;
                }
                onStatusChange?.(list, custom);
            },
            notifyAddClick: (event) => onAddClick?.(event),
            notifySearch: (inputValue, custom) => onSearch?.(inputValue, custom),
        })
    );

    const text = $derived(locale().locale);

    // not `prefix`: the Input below has a snippet of that name
    const contentCls = cssClasses.MCP_CONFIGURE_CONTENT;
    const buttonCls = buttonClasses.PREFIX;
    const illustrationStyle = 'width: 150px; height: 150px';
    const isCustom = $derived(states().mode === strings.MCP_MODE.CUSTOM);
    const showOptions = $derived(getShowOptions(foundationProps, states().mode, states().query));
    const activatedCount = $derived([...innerList, ...customList].filter((option) => option.active).length);
    const total = $derived(innerList.length + customList.length);

    const statusLabel = (option: MCPOption) => (option.active ? text.disable : text.enable);
</script>

{#snippet addButton()}
    <Button theme="solid" type="primary" onclick={foundation.handleAddClick}>
        {#snippet icon()}
            <IconPlus />
        {/snippet}
        {text.newMcpAdd}
    </Button>
{/snippet}

{#snippet searchInput()}
    <Input class={isCustom ? undefined : `${contentCls}-search`} onChange={foundation.handleSearch} placeholder={placeholder ?? text.searchPlaceholder} showClear={false} value={states().inputValue}>
        {#snippet prefix()}
            <IconSearch />
        {/snippet}
    </Input>
{/snippet}

<div class={contentCls}>
    <div class={`${contentCls}-header`}>
        <RadioGroup aria-label={text.mcpConfigure} onChange={(event) => foundation.handleModeChange(event.target.value as MCPConfigureMode)} type="button" value={states().mode}>
            <Radio value={strings.MCP_MODE.INNER}>{text.mcpServers}</Radio>
            <Radio value={strings.MCP_MODE.CUSTOM}>{text.newMcpAdd}</Radio>
        </RadioGroup>
        <span class={`${contentCls}-header-count`}>{text.activeMCPNumber} {activatedCount}/{total}</span>
    </div>
    {#if isCustom && customList.length === 0}
        <Empty class={`${contentCls}-custom-empty`}>
            {#snippet image()}
                <IllustrationNoContent style={illustrationStyle} />
            {/snippet}
            {#snippet darkModeImage()}
                <IllustrationNoContentDark style={illustrationStyle} />
            {/snippet}
            {#snippet description()}{text.emptyCustomMcpInfo}{/snippet}
            {@render addButton()}
        </Empty>
    {:else if isCustom}
        <div class={[`${contentCls}-search`, `${contentCls}-search-container`]}>
            {@render searchInput()}
            {@render addButton()}
        </div>
    {:else}
        {@render searchInput()}
    {/if}
    <div class={`${contentCls}-item-container`}>
        {#each showOptions as option, index (option.value)}
            {#if item}
                {@render item({ custom: isCustom, index, item: option as MCPConfigureOption })}
            {:else}
                <div class={`${contentCls}-item`}>
                    {#if !icon && option.icon}
                        <img alt="" class={`${contentCls}-item-sign`} src={option.icon} />
                    {:else}
                        <div class={`${contentCls}-item-sign`}>
                            {@render icon?.({ custom: isCustom, index, item: option as MCPConfigureOption })}
                        </div>
                    {/if}
                    <div class={`${contentCls}-item-content`}>
                        <div class={`${contentCls}-item-content-label`}>{option.label}</div>
                        <div class={`${contentCls}-item-content-desc`}>
                            {#if desc}{@render desc({ custom: isCustom, index, item: option as MCPConfigureOption })}{:else}{option.desc}{/if}
                        </div>
                    </div>
                    {#if option.configure}
                        <Button aria-label={text.configure} class={[`${contentCls}-item-button`, `${contentCls}-item-button-configure`]} onclick={(event: MouseEvent) => foundation.onConfigureButtonClick(event, option)}>
                            {#snippet icon()}
                                <IconSetting />
                            {/snippet}
                        </Button>
                    {/if}
                    {#if isCustom}
                        <Button aria-label={text.edit} class={[`${contentCls}-item-button`, `${contentCls}-item-button-configure`]} onclick={(event: MouseEvent) => foundation.onEditButtonClick(event, option)}>
                            {#snippet icon()}
                                <IconEdit />
                            {/snippet}
                        </Button>
                    {/if}
                    {#if option.disabled}
                        <!-- Keeps a focusable trigger so the tooltip reason reaches the keyboard; Button's native disabled
                            leaves the Tab order. No click listener since the status cannot change. -->
                        <Tooltip>
                            {#snippet child({ props })}
                                <button
                                    {...props}
                                    aria-disabled="true"
                                    aria-label={statusLabel(option)}
                                    class={[buttonCls, `${buttonCls}-${option.active ? 'light' : 'solid'}`, `${buttonCls}-disabled`, `${buttonCls}-primary-disabled`, `${buttonCls}-with-icon`, `${buttonCls}-with-icon-only`, `${contentCls}-item-button`]}
                                    type="button"
                                >
                                    <span class={`${buttonCls}-content`}>
                                        {#if option.active}<IconMinus />{:else}<IconPlus />{/if}
                                    </span>
                                </button>
                            {/snippet}
                            {#snippet content()}{text.defaultMcpInfo}{/snippet}
                        </Tooltip>
                    {:else}
                        <Button aria-label={statusLabel(option)} class={`${contentCls}-item-button`} theme={option.active ? 'light' : 'solid'} type="primary" onclick={() => foundation.handleStatusChange(option, !option.active)}>
                            {#snippet icon()}
                                {#if option.active}<IconMinus />{:else}<IconPlus />{/if}
                            {/snippet}
                        </Button>
                    {/if}
                </div>
            {/if}
        {/each}
    </div>
</div>
