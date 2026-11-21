<script lang="ts">
    import type { Snippet } from 'svelte';
    import { cssClasses } from '@fibrae/semi-foundation/components/tabs/constants';
    import { IconChevronLeft, IconChevronRight } from '@fibrae/semi-icons-svelte';
    import { Button } from '../button/index.js';
    import { Dropdown, DropdownItem, DropdownMenu, type DropdownTriggerProps } from '../dropdown/index.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import type { OverflowItem, PlainTab, TabBarProps, TabsDropdownItemProps, TabsTabSnippetProps } from './interface.js';

    interface Props {
        classNames?: TabBarProps['classNames'];
        styles?: TabBarProps['styles'];
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

    let { classNames, styles, items, list, position, showRestInDropdown, dropdownProps, tab, icon, onArrowClick, onTabClick }: Props = $props();

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
    <div {...props} class={[`${prefix}-arrow-${position}`, `${prefix}-arrow`, props?.class, classNames?.arrow]} role="presentation" style={styles?.arrow} tabindex="-1" onclick={onArrowClick}>
        <Button aria-label={label} icon={arrowIcon} theme="borderless" />
    </div>
{/snippet}

{#if !items.length}
    <div class={[`${prefix}-arrow-${position}`, `${prefix}-arrow`, classNames?.arrow]} role="presentation" style={styles?.arrow}>
        <Button aria-label={label} disabled icon={arrowIcon} theme="borderless" />
    </div>
{:else if showRestInDropdown}
    <Dropdown clickToHide clickTriggerToHide disableFocusListener position={position === 'start' ? 'bottomLeft' : 'bottomRight'} showTick trigger="hover" {...dropdownProps} class={[`${prefix}-dropdown`, classNames?.dropdown, dropdownProps?.class] as unknown as string} style={styles?.dropdown}>
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
