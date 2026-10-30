<script lang="ts">
    import { Dropdown, DropdownItem, DropdownMenu, type DropdownProps, type DropDownMenuItem, type DropdownTriggerProps } from '..';

    type Mode = 'bind' | 'function' | 'one-way' | 'uncontrolled';
    type TriggerKind = 'button' | 'text' | 'role' | 'plain' | 'self-click';
    type ContentKind = 'items' | 'data' | 'panel' | 'empty';
    type Entry = [label: string, props?: Record<string, unknown>];

    interface Store {
        value?: boolean;
        accept: boolean;
        log: string[];
        trigger: TriggerKind;
        content: ContentKind;
        entries: Entry[];
        menu: DropDownMenuItem[];
        icons: boolean;
    }

    let {
        mode = 'uncontrolled',
        store,
        props = {},
    }: {
        mode?: Mode;
        store: Store;
        props?: Omit<DropdownProps, 'visible' | 'children' | 'child' | 'content' | 'menuIcon' | 'menu'>;
    } = $props();

    let dropdown = $state<ReturnType<typeof Dropdown>>();

    const log = (entry: string) => {
        store.log.push(entry);
    };

    const common = $derived({
        motion: false,
        mouseEnterDelay: 0,
        mouseLeaveDelay: 0,
        ...props,
        afterClose: () => log('afterClose'),
        afterOpen: () => log('afterOpen'),
        onEscKeyDown: (event: KeyboardEvent) => log(`esc ${event instanceof KeyboardEvent}`),
        onClickOutSide: (event: MouseEvent) => log(`outside ${event instanceof MouseEvent}`),
        onVisibleChange: (value: boolean) => log(`change ${value}`),
    });

    export function api() {
        if (!dropdown) {
            throw new Error('Dropdown is not mounted');
        }
        return dropdown;
    }
</script>

{#snippet child({ props: triggerProps }: { props: DropdownTriggerProps })}
    {#if store.trigger === 'button'}
        <button {...triggerProps} type="button">trigger</button>
    {:else if store.trigger === 'role'}
        <span {...triggerProps} role="menuitem" tabindex="0">role trigger</span>
    {:else if store.trigger === 'self-click'}
        <!-- clicks itself on Enter and prevents the default, as Tag and Avatar do -->
        <div
            {...triggerProps}
            role="button"
            tabindex="0"
            onclick={() => log('trigger click')}
            onkeydown={(event) => {
                if (event.key === 'Enter') {
                    event.currentTarget.click();
                    event.preventDefault();
                }
            }}
        >
            self click
        </div>
    {:else}
        <div {...triggerProps}>plain trigger</div>
    {/if}
{/snippet}

{#snippet content()}
    {#if store.content === 'items'}
        <DropdownMenu>
            {#each store.entries as [label, entryProps] (label)}
                <DropdownItem {...entryProps}>{label}</DropdownItem>
            {/each}
        </DropdownMenu>
    {:else if store.content === 'panel'}
        <div>
            <button type="button">panel first</button>
            <button type="button">panel last</button>
        </div>
    {/if}
{/snippet}

{#snippet menuIcon({ item }: { item: { name?: string | number } })}
    {#if item.name === 'C'}<span data-testid="icon"></span>{/if}
{/snippet}

<p>outside</p>
{#if mode === 'bind'}
    <Dropdown bind:this={dropdown} bind:visible={store.value} {...common} child={store.trigger === 'text' ? undefined : child} content={store.content === 'data' ? undefined : content} menu={store.menu} menuIcon={store.icons ? menuIcon : undefined}>text trigger</Dropdown>
{:else if mode === 'function'}
    <Dropdown
        bind:this={dropdown}
        bind:visible={
            () => store.value,
            (value) => {
                log(`set ${value}`);
                if (store.accept) store.value = value;
            }
        }
        {...common}
        child={store.trigger === 'text' ? undefined : child}
        content={store.content === 'data' ? undefined : content}
        menu={store.menu}
        menuIcon={store.icons ? menuIcon : undefined}>text trigger</Dropdown
    >
{:else if mode === 'one-way'}
    <Dropdown bind:this={dropdown} visible={store.value} {...common} child={store.trigger === 'text' ? undefined : child} content={store.content === 'data' ? undefined : content} menu={store.menu} menuIcon={store.icons ? menuIcon : undefined}>text trigger</Dropdown>
{:else}
    <Dropdown bind:this={dropdown} {...common} child={store.trigger === 'text' ? undefined : child} content={store.content === 'data' ? undefined : content} menu={store.menu} menuIcon={store.icons ? menuIcon : undefined}>text trigger</Dropdown>
{/if}
