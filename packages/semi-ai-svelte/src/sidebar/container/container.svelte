<script lang="ts">
    import { untrack } from 'svelte';
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/sidebar/constants';
    import ContainerFoundation, { type ContainerAdapter, type ContainerProps as FoundationProps } from '@fibrae/semi-ai-foundation/sidebar/container-foundation';
    import { canRestoreFocus } from '@fibrae/semi-ai-foundation/sidebar/utils';
    import FocusScope from '@fibrae/semi-foundation/utils/focus-scope';
    import { openLayer } from '@fibrae/semi-foundation/utils/layer';
    import ReleaseHolder from '@fibrae/semi-foundation/utils/release-holder';
    import '@fibrae/semi-ai-foundation/sidebar/sidebar.scss';
    import { IconClose } from '@fibrae/semi-icons-svelte';
    import cssAnimation from '@fibrae/semi-ui-svelte/_base/css-animation';
    import { groupRole } from '@fibrae/semi-ui-svelte/_base/group-role';
    import useFoundation from '@fibrae/semi-ui-svelte/_base/use-foundation.svelte.js';
    import watch from '@fibrae/semi-ui-svelte/_base/watch.svelte.js';
    import Button from '@fibrae/semi-ui-svelte/button/button.svelte';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import Resizable from '@fibrae/semi-ui-svelte/resizable/resizable.svelte';
    import type { ContainerProps } from './interface.js';

    // No fallback on `visible`: a bound `undefined` would throw with one, and undefined means hidden
    let { visible = $bindable(), title, motion = true, resizable = true, minWidth = 150, maxWidth, defaultSize, showClose = true, closeOnEsc = false, onCancel, afterVisibleChange, header, children, ...rest }: ContainerProps = $props();

    const locale = useLocale('Sidebar');

    let rootEl = $state.raw<HTMLDivElement | null>(null);

    // Kept by the transition events: true once the element has entered, false once its leave has ended. It starts at
    // visible so an initially visible container reports no change.
    let displayed = $state(untrack(() => Boolean(visible)));

    // True from the focus record on until the close has handed focus back, so a container hidden in the tick it
    // mounted, before its element ever existed, still returns focus
    let recorded = false;
    const layer = new ReleaseHolder();
    const focusScope = new FocusScope();

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
            // the page beside the sidebar stays usable, so the layer is not modal; it covers the Resizable around the
            // container when there is one, because the drag handles are its children and a modal layer opened earlier
            // would make them inert
            openLayer: (onEscape) => layer.hold(() => openLayer({ element: (resizable ? rootEl?.parentElement : null) ?? (rootEl as HTMLElement), modal: false, onEscape })),
            closeLayer: () => layer.release(),
            toggleDisplayNone: (displayNone) => {
                displayed = !displayNone;
            },
            restoreFocus: () => {
                if (canRestoreFocus(rootEl)) {
                    focusScope.restore(true);
                }
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
            untrack(() => {
                recorded = true;
                focusScope.record();
            });
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

    // afterHide is not enough: a container hidden in the tick it mounted never ran beforeShow, yet focus may already
    // be inside it and would drop to the body on unmount
    $effect(() => {
        if (!visible && recorded) {
            untrack(() => {
                recorded = false;
                foundation.restoreFocus();
            });
        }
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
        role={groupRole(rest)}
        onintroend={foundation.handleAnimationEnd}
        onoutroend={foundation.handleAnimationEnd}
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
