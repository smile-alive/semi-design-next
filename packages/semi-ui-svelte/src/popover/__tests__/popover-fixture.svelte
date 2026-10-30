<script lang="ts">
    import ConfigProvider from '../../config-provider/config-provider.svelte';
    import type { RenderContentProps, TooltipTriggerProps } from '../../tooltip';
    import type { PopoverProps } from '../interface';
    import Popover from '../popover.svelte';

    type Mode = 'bind' | 'function' | 'one-way' | 'uncontrolled';

    let {
        mode = 'uncontrolled',
        store,
    }: {
        mode?: Mode;
        store: {
            value?: boolean;
            accept: boolean;
            log: string[];
            shown: boolean;
            child: boolean;
            focus: boolean;
            actions: boolean;
            rtl: boolean;
            props: Omit<PopoverProps, 'visible' | 'children' | 'child' | 'content'>;
        };
    } = $props();

    let pop = $state<Popover>();

    const log = (entry: string) => {
        store.log.push(entry);
    };

    const common = $derived({
        ...store.props,
        afterClose: () => log('afterClose'),
        afterOpen: () => log('afterOpen'),
        onOpen: () => log('open'),
        onVisibleChange: (value: boolean) => log(`change ${value}`),
        onEscKeyDown: (event: KeyboardEvent) => log(`esc ${event instanceof KeyboardEvent}`),
        onClickOutSide: (event: MouseEvent) => log(`outside ${event instanceof MouseEvent}`),
    });

    export function api() {
        return pop;
    }
</script>

{#snippet content({ initialFocusRef }: RenderContentProps)}
    <span>content</span>
    {#if store.actions}
        <button type="button">first</button>
        {#if store.focus}
            <input {@attach initialFocusRef} aria-label="initial" />
        {/if}
        <button type="button">last</button>
    {/if}
{/snippet}

{#snippet child({ props: triggerProps }: { props: TooltipTriggerProps })}
    <button {...triggerProps} type="button">trigger</button>
{/snippet}

{#snippet body()}
    {#if store.shown}
        {#if mode === 'bind'}
            <Popover bind:this={pop} bind:visible={store.value} {...common} child={store.child ? child : undefined} {content}>trigger</Popover>
        {:else if mode === 'function'}
            <Popover
                bind:this={pop}
                bind:visible={
                    () => store.value,
                    (value) => {
                        log(`set ${value}`);
                        if (store.accept) store.value = value;
                    }
                }
                {...common}
                child={store.child ? child : undefined}
                {content}>trigger</Popover
            >
        {:else if mode === 'one-way'}
            <Popover bind:this={pop} {content} visible={store.value} {...common} child={store.child ? child : undefined}>trigger</Popover>
        {:else}
            <Popover bind:this={pop} {...common} child={store.child ? child : undefined} {content}>trigger</Popover>
        {/if}
    {/if}
{/snippet}

<p>outside</p>
{#if store.rtl}
    <ConfigProvider direction="rtl">{@render body()}</ConfigProvider>
{:else}
    {@render body()}
{/if}
<button type="button" onclick={() => pop?.focusTrigger()}>focus</button>
<output aria-label="visible">{String(store.value)}</output>
