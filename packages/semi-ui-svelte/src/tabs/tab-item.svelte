<script lang="ts">
    import { cssClasses, getPanelId, getTabDataKey, getTabId } from '@fibrae/semi-foundation/tabs/constants';
    import { IconClose } from '@fibrae/semi-icons-svelte';
    import useLocale from '../locale/use-locale.svelte.js';
    import { getTabsContext } from './context.js';
    import type { TabItemProps } from './interface.js';

    let { itemKey = '', selected = false, disabled = false, closable = false, size, type, tabPosition, onClick, tab, icon, ...rest }: TabItemProps = $props();

    const ctx = getTabsContext();
    const locale = useLocale('Tabs');

    const prefix = cssClasses.TABS_TAB;
    const resolvedType = $derived(type ?? ctx?.view.type ?? 'line');
    const resolvedPosition = $derived(tabPosition ?? ctx?.view.tabPosition ?? 'top');
    const resolvedSize = $derived(size ?? ctx?.view.size);

    // Outside Tabs there is no panel to point at, and with a single mounted panel only the selected tab has one
    const ids = $derived.by(() => {
        if (!ctx) {
            return {};
        }
        const { tabsId, everyPanelMounted } = ctx.view;
        return { id: getTabId(tabsId, itemKey), 'aria-controls': everyPanelMounted || selected ? getPanelId(tabsId, itemKey) : undefined };
    });

    const handleClick = (event: MouseEvent) => {
        if (disabled) {
            return;
        }
        ctx?.tabClick(itemKey, event);
        onClick?.(itemKey, event);
    };

    const handleKeyDown = (event: KeyboardEvent & { currentTarget: HTMLDivElement }) => {
        rest.onkeydown?.(event);
        ctx?.handleKeyDown(event, itemKey, closable);
    };

    const handleClose = (event: MouseEvent) => {
        event.stopPropagation();
        if (!disabled) {
            ctx?.deleteTab(itemKey);
        }
    };
</script>

<!-- Passed-through attributes come first so role, ids, aria states and tabindex stay the component's -->
<div
    {...rest}
    {...ids}
    aria-disabled={disabled ? 'true' : 'false'}
    aria-selected={selected ? 'true' : 'false'}
    class={[prefix, `${prefix}-${resolvedType}`, `${prefix}-${resolvedPosition}`, `${prefix}-single`, rest.class, { [cssClasses.TABS_TAB_ACTIVE]: selected, [cssClasses.TABS_TAB_DISABLED]: disabled, [`${prefix}-small`]: resolvedSize === 'small', [`${prefix}-medium`]: resolvedSize === 'medium' }]}
    data-tabkey={getTabDataKey(itemKey)}
    role="tab"
    tabindex={selected || itemKey === ctx?.view.tabbableKey ? 0 : -1}
    onclick={handleClick}
    onkeydown={handleKeyDown}
>
    {#if icon}
        <span class="{cssClasses.TABS_BAR}-icon">{@render icon()}</span>
    {/if}
    {@render tab?.()}
    {#if closable}
        <!-- Keyboard users close with Backspace and Delete on the tab; this named button is the pointer and screen reader affordance -->
        <span aria-label={locale().locale.close} role="button" onclick={handleClose}>
            <IconClose class="{prefix}-icon-close" />
        </span>
    {/if}
</div>
