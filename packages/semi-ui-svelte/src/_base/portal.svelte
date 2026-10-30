<script lang="ts">
    import { onMount, type Snippet } from 'svelte';
    import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
    import { resolvePopupContainer } from '@fibrae/semi-foundation/utils/dom';
    import '@fibrae/semi-foundation/_portal/portal.scss';
    import { getConfigContext } from '../config-provider/context.js';
    import { getTooltipPopupsContext } from '../tooltip/context.js';
    import PopupLayerProvider from './popup-layer-provider.svelte';
    import teleport from './teleport.js';

    let {
        getPopupContainer,
        zIndex,
        children,
    }: {
        getPopupContainer?: () => HTMLElement | null;
        zIndex?: number;
        children: Snippet<[{ inBody: boolean }]>;
    } = $props();

    const config = getConfigContext();

    // Moved out of the DOM of an enclosing Tooltip's popup, which must still count it as inside: otherwise a press in a
    // Modal opened from a Popover reads as a click outside
    const popups = getTooltipPopupsContext();

    let root = $state.raw<HTMLDivElement | null>(null);

    // Set in onMount: getPopupContainer may query a node absent until the parent mounts, and the server renders nothing.
    // Outside the fullscreen element nothing is shown or clickable, so a popup mounted during fullscreen goes into it.
    // Known limit: chosen once at mount, so a popup mounted before fullscreen stays in the body. Upgrade: re-target on
    // show once keepDOM overlays are used across fullscreen.
    let defaultContainer = $state.raw<HTMLElement | null>(null);

    // Children render only once the div is inside its container: a child's effects run before an attachment of the same
    // flush, so a child that focuses an element or reads DOM position (a layer's inert marks) would act on the
    // pre-move position, and the move would drop the focus.
    let placed = $state.raw(false);

    const prefix = `${BASE_CLASS_PREFIX}-portal`;

    // An element, compared by identity: the attachment re-runs only when it changes, since moving the open popup would
    // drop the focus inside it
    const container = $derived(defaultContainer && resolvePopupContainer(getPopupContainer ?? config.getPopupContainer, defaultContainer));

    // a fullscreen element is the whole visible page, so an overlay in it covers the page like one in the body
    const inBody = $derived(container === defaultContainer || container === container?.ownerDocument.body);

    onMount(() => {
        const { fullscreenElement } = document;
        defaultContainer = fullscreenElement instanceof HTMLElement ? fullscreenElement : document.body;
        return popups?.register(() => root);
    });
</script>

<!-- The moved div must stay the only node of this block, see teleport.ts -->
{#if container}
    <div
        {@attach (node) => {
            const release = teleport(container)(node);
            placed = true;
            return release;
        }}
        bind:this={root}
        class={prefix}
        dir={config.direction}
        style:position={inBody ? undefined : 'static'}
        style:z-index={zIndex}
    >
        {#if placed}
            <PopupLayerProvider>
                {@render children({ inBody })}
            </PopupLayerProvider>
        {/if}
    </div>
{/if}
