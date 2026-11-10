<script lang="ts">
    import { untrack } from 'svelte';
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/components/sidebar/constants';
    import ContainerFoundation, { type ContainerAdapter, type ContainerProps as FoundationProps } from '@fibrae/semi-ai-foundation/components/sidebar/container-foundation';
    import { namedRole } from '@fibrae/semi-foundation/utils';
    import '@fibrae/semi-ai-foundation/components/sidebar/sidebar.scss';
    import { IconClose } from '@fibrae/semi-icons-svelte';
    import { useFoundation } from '@fibrae/semi-ui-svelte/base';
    import Button from '@fibrae/semi-ui-svelte/button/button.svelte';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import { watch } from '@fibrae/semi-ui-svelte/hooks/index';
    import Resizable from '@fibrae/semi-ui-svelte/resizable/resizable.svelte';
    import { cssAnimation } from '@fibrae/semi-ui-svelte/utils';
    import type { ContainerProps } from './interface.js';

    // No fallback on `visible`: a bound `undefined` would throw with one, and undefined means hidden
    let { visible = $bindable(), title, motion = true, resizable = true, minWidth = 150, maxWidth, defaultSize, showClose = true, closeOnEsc = false, onCancel, afterVisibleChange, header, children, onintroend, onoutroend, ...rest }: ContainerProps = $props();

    const locale = useLocale('Sidebar');

    let rootEl = $state.raw<HTMLDivElement | null>(null);

    // Kept by the transition events: true once the element has entered, false once its leave has ended. It starts at
    // visible so an initially visible container reports no change.
    let displayed = $state(untrack(() => Boolean(visible)));

    const prefix = cssClasses.SIDEBAR;
    const resizableProps = $derived({ defaultSize, enable: strings.DIRECTION, maxWidth, minWidth });

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: FoundationProps = {
        get closeOnEsc() {
            return closeOnEsc;
        },
        get visible() {
            return visible;
        },
    };

    const { foundation } = useFoundation<ContainerFoundation, ContainerAdapter, FoundationProps, Record<string, never>>(
        ContainerFoundation,
        foundationProps,
        () => ({}),
        () => ({
            notifyCancel: (event) => cancel(event),
            notifyVisibleChange: (isVisible) => afterVisibleChange?.(isVisible),
            getRoot: () => rootEl,
            getLayer: () => (resizable ? rootEl?.parentElement : null) ?? rootEl,
            toggleDisplayNone: (displayNone) => {
                displayed = !displayNone;
            },
        })
    );

    const cancel = (event: MouseEvent | KeyboardEvent) => {
        // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides locally
        visible = false;
        onCancel?.(event);
    };

    // Before the DOM updates, so the focus is recorded ahead of anything in the container taking it
    $effect.pre(() => {
        if (visible) {
            untrack(foundation.recordFocus);
        }
    });

    // The element joins the source because it renders only once visible; the effect runs once it is in the DOM
    $effect(() => {
        if (!visible || !rootEl) {
            return;
        }
        untrack(foundation.beforeShow);
        return foundation.afterHide;
    });

    watch(() => displayed, foundation.onVisibleChange);

    /** The `.semi-sidebar-container` element; null while hidden */
    export function getRoot() {
        return rootEl;
    }
</script>

{#snippet panel()}
    <div
        {...rest}
        bind:this={rootEl}
        class={[`${prefix}-container`, rest.class]}
        in:cssAnimation|global={{ className: `${prefix}-animation-content_show`, motion }}
        out:cssAnimation|global={{ className: `${prefix}-animation-content_hide`, motion }}
        role={namedRole(rest)}
        onintroend={(event) => {
            foundation.handleAnimationEnd();
            onintroend?.(event);
        }}
        onoutroend={(event) => {
            foundation.handleAnimationEnd();
            onoutroend?.(event);
        }}
    >
        {#if header}
            {@render header()}
        {:else}
            <div class={`${prefix}-container-header`}>
                <div class={`${prefix}-container-header-title`} x-semi-prop="title">
                    {#if typeof title === 'string'}{title}{:else}{@render title?.()}{/if}
                </div>
                {#if showClose}
                    <Button aria-label={locale().locale.close} class={`${prefix}-container-header-closeBtn`} size="small" theme="borderless" type="tertiary" onclick={cancel}>
                        {#snippet icon()}
                            <IconClose />
                        {/snippet}
                    </Button>
                {/if}
            </div>
        {/if}
        <div class={`${prefix}-container-content`}>
            {@render children?.()}
        </div>
    </div>
{/snippet}

{#if visible}
    {#if resizable}
        <Resizable {...resizableProps}>
            {@render panel()}
        </Resizable>
    {:else}
        {@render panel()}
    {/if}
{/if}
