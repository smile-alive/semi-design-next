<script lang="ts">
    import { onMount } from 'svelte';
    import { cssClasses } from '@fibrae/semi-foundation/resizable/constants';
    import { isSecondaryPress } from '@fibrae/semi-foundation/utils/pointer';
    import { IconHandle } from '@fibrae/semi-icons-svelte';
    import useLocale from '../locale/use-locale.svelte.js';
    import { getResizeGroupContext } from './context.js';
    import type { ResizeHandlerProps } from './interface.js';

    let { children, ...rest }: ResizeHandlerProps = $props();

    const group = getResizeGroupContext('ResizeHandler');
    const locale = useLocale('Resizable');

    let handler = $state<HTMLDivElement>();

    const prefix = cssClasses.PREFIX;
    const horizontal = $derived(group.direction === 'horizontal');

    const handlePointerdown = (e: PointerEvent & { currentTarget: HTMLDivElement }) => {
        if (isSecondaryPress(e)) return;
        // capturing keeps the moves and the release on the handler wherever the pointer goes
        e.currentTarget.setPointerCapture(e.pointerId);
        group.notifyResizeStart(e.currentTarget, e);
    };

    const handleKeydown = (e: KeyboardEvent & { currentTarget: HTMLDivElement }) => {
        if (group.notifyKeyDown(e.currentTarget, e)) {
            e.preventDefault();
        }
    };

    onMount(() => group.registerHandler(handler as HTMLDivElement));
</script>

<div
    aria-label={locale().locale.separator}
    bind:this={handler}
    {...rest}
    aria-orientation={horizontal ? 'vertical' : 'horizontal'}
    class={[`${prefix}-handler`, `${prefix}-handler-${group.direction}`, rest.class]}
    role="separator"
    tabindex={0}
    onkeydown={handleKeydown}
    onlostpointercapture={(e) => group.notifyResizeEnd(e.currentTarget, e)}
    onpointerdown={handlePointerdown}
    onpointermove={(e) => group.notifyResizing(e.currentTarget, e)}
>
    {#if children}
        {@render children()}
    {:else}
        <IconHandle size="inherit" style={`rotate: ${horizontal ? '0deg' : '90deg'}`} />
    {/if}
</div>
