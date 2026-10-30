<script lang="ts">
    import { tick } from 'svelte';
    import type { Attachment } from 'svelte/attachments';
    import { cssClasses } from '@fibrae/semi-foundation/json-viewer/constants';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import { IconSearch } from '@fibrae/semi-icons-svelte';
    import Button from '../button/button.svelte';
    import dragMove from '../drag-move/drag-move.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { getJsonViewerContext } from './context.js';
    import SearchBar from './search-bar.svelte';

    const ctx = getJsonViewerContext('SearchButton');
    const locale = useLocale('JsonViewer');

    let trigger = $state<HTMLButtonElement>();

    // A drag that started on the trigger ends with a click on it, which is swallowed; the click follows pointerup in the
    // same task, so the flag clears after it. Keyboard activation is never swallowed.
    let dragged = false;

    const prefix = cssClasses.PREFIX;

    const trackTrigger: Attachment<HTMLButtonElement> = (node) => {
        trigger = node;
        return () => (trigger = undefined);
    };

    const onDragMove = () => {
        dragged = true;
    };

    const onDragEnd = () => {
        setTimeout(() => {
            dragged = false;
        });
    };

    const onTriggerClick = (event: MouseEvent) => {
        if (dragged) {
            event.stopPropagation();
            return;
        }
        ctx.toggleSearchBar();
    };

    // closing removes the focused control, so focus returns to the trigger that replaces it
    const close = async () => {
        ctx.toggleSearchBar();
        await tick();
        trigger?.focus();
    };
</script>

<!-- style: directives, so the position the drag writes is not rewritten by a style attribute update -->
<div
    {@attach dragMove({
        constrainer: ctx.limitSearchButtonBounds ? 'parent' : undefined,
        onMouseMove: onDragMove,
        onMouseUp: onDragEnd,
        onTouchCancel: onDragEnd,
        onTouchEnd: onDragEnd,
        onTouchMove: onDragMove,
    })}
    style:left={toCssLength(ctx.width)}
    style:position="absolute"
    style:top="0"
>
    {#if !ctx.showSearchBar}
        <Button {@attach trackTrigger} aria-label={locale().locale.search} class={`${prefix}-search-bar-trigger`} style="position: absolute; top: 20px; right: 20px" onclick={onTriggerClick}>
            {#snippet icon()}
                <IconSearch />
            {/snippet}
        </Button>
    {:else}
        <SearchBar onClose={close} />
    {/if}
</div>
