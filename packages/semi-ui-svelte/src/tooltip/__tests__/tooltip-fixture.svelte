<script lang="ts">
    import Portal from '../../_base/portal.svelte';
    import type { TooltipProps, TooltipTriggerProps } from '../interface';
    import Tooltip from '../tooltip.svelte';

    type Mode = 'bind' | 'function' | 'one-way' | 'uncontrolled';

    let {
        mode = 'uncontrolled',
        store,
        props = {},
    }: {
        mode?: Mode;
        store: { value?: boolean; accept: boolean; log: string[]; shown: boolean; child: boolean; focus: boolean; arrow: boolean };
        props?: Omit<TooltipProps, 'visible' | 'children' | 'child' | 'content' | 'arrow'>;
    } = $props();

    let tip = $state<Tooltip>();

    const log = (entry: string) => {
        store.log.push(entry);
    };

    const common = $derived({
        ...props,
        afterClose: () => log('afterClose'),
        afterOpen: () => log('afterOpen'),
        onOpen: () => log('open'),
        onVisibleChange: (value: boolean) => log(`change ${value}`),
        onEscKeyDown: (event: KeyboardEvent) => log(`esc ${event instanceof KeyboardEvent}`),
        onClickOutSide: (event: MouseEvent) => log(`outside ${event instanceof MouseEvent}`),
    });

    export function api() {
        return tip;
    }
</script>

{#snippet content({ initialFocusRef }: { initialFocusRef: (target: { focus: () => void }) => void })}
    <span>content</span>
    <Portal>
        <button type="button">in portal</button>
    </Portal>
    {#if store.focus}
        <input {@attach initialFocusRef} aria-label="inner" />
    {/if}
{/snippet}

{#snippet child({ props: triggerProps }: { props: TooltipTriggerProps })}
    <button {...triggerProps} type="button">trigger</button>
{/snippet}

{#snippet customArrow()}
    <i data-testid="custom-arrow"></i>
{/snippet}

<p>outside</p>
{#if store.shown}
    {#if mode === 'bind'}
        <Tooltip bind:this={tip} bind:visible={store.value} {...common} arrow={store.arrow ? customArrow : undefined} child={store.child ? child : undefined} {content}>trigger</Tooltip>
    {:else if mode === 'function'}
        <Tooltip
            bind:this={tip}
            bind:visible={
                () => store.value,
                (value) => {
                    log(`set ${value}`);
                    if (store.accept) store.value = value;
                }
            }
            {...common}
            arrow={store.arrow ? customArrow : undefined}
            child={store.child ? child : undefined}
            {content}>trigger</Tooltip
        >
    {:else if mode === 'one-way'}
        <Tooltip bind:this={tip} {content} visible={store.value} {...common} arrow={store.arrow ? customArrow : undefined} child={store.child ? child : undefined}>trigger</Tooltip>
    {:else}
        <Tooltip bind:this={tip} {...common} arrow={store.arrow ? customArrow : undefined} child={store.child ? child : undefined} {content}>trigger</Tooltip>
    {/if}
{/if}
