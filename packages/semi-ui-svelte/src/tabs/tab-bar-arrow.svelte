<script lang="ts">
    import type { Snippet } from 'svelte';
    import { cssClasses } from '@fibrae/semi-foundation/tabs/constants';
    import { IconChevronLeft, IconChevronRight } from '@fibrae/semi-icons-svelte';
    import { Button } from '../button/index.js';
    import { Dropdown, DropdownItem, DropdownMenu, type DropdownTriggerProps } from '../dropdown/index.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import type { OverflowItem, PlainTab, TabsDropdownItemProps, TabsTabSnippetProps } from './interface.js';

    interface Props {
        items: OverflowItem[];
        list: PlainTab[];
        position: 'start' | 'end';
        showRestInDropdown: boolean;
        dropdownProps?: TabsDropdownItemProps;
        tab?: Snippet<[TabsTabSnippetProps]>;
        icon?: Snippet<[TabsTabSnippetProps]>;
        onArrowClick: () => void;
        onTabClick: (itemKey: string, event: MouseEvent) => void;
    }

    let { items, list, position, showRestInDropdown, dropdownProps, tab, icon, onArrowClick, onTabClick }: Props = $props();

    const locale = useLocale('Tabs');

    const prefix = cssClasses.TABS_BAR;
    const label = $derived(position === 'start' ? locale().locale.prevTabs : locale().locale.nextTabs);

    const rows = $derived(
        items.map((overflow) => {
            const index = list.findIndex((entry) => entry.itemKey === overflow.itemKey);
            return { overflow, snippetProps: { item: list[index] ?? overflow, index } };
        })
    );
</script>

{#snippet arrowIcon()}
    {#if position === 'start'}
        <IconChevronLeft />
    {:else}
        <IconChevronRight />
    {/if}
{/snippet}

<!-- The Button is the Tab stop and the keyboard target: its Enter and Space click bubbles to this pointer wrapper -->
{#snippet arrowBox(props?: DropdownTriggerProps)}
    <div {...props} class={[`${prefix}-arrow-${position}`, `${prefix}-arrow`, props?.class]} role="presentation" tabindex="-1" onclick={onArrowClick}>
        <Button aria-label={label} icon={arrowIcon} theme="borderless" />
    </div>
{/snippet}

{#if !items.length}
    <div class={[`${prefix}-arrow-${position}`, `${prefix}-arrow`]} role="presentation">
        <Button aria-label={label} disabled icon={arrowIcon} theme="borderless" />
    </div>
{:else if showRestInDropdown}
    <Dropdown clickToHide clickTriggerToHide disableFocusListener position={position === 'start' ? 'bottomLeft' : 'bottomRight'} showTick trigger="hover" {...dropdownProps} class={[`${prefix}-dropdown`, dropdownProps?.class].filter(Boolean).join(' ')}>
        {#snippet child({ props })}
            {@render arrowBox(props)}
        {/snippet}
        {#snippet content()}
            <DropdownMenu>
                {#each rows as { overflow, snippetProps } (overflow.itemKey)}
                    <DropdownItem active={overflow.active} disabled={overflow.disabled} onclick={(event) => onTabClick(overflow.itemKey, event)}>
                        {#if icon}
                            <span>{@render icon(snippetProps)}</span>
                        {/if}
                        {#if tab}
                            {@render tab(snippetProps)}
                        {:else}
                            {overflow.tab}
                        {/if}
                    </DropdownItem>
                {/each}
            </DropdownMenu>
        {/snippet}
    </Dropdown>
{:else}
    {@render arrowBox()}
{/if}
