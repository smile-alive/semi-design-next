<script lang="ts">
    import { on } from 'svelte/events';
    import { strings } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
    import { isSelectionInsideNode } from '@fibrae/semi-ai-foundation/ai-chat-input/extension/input-slot';
    import type { SlotViewProps } from './node-view.svelte.js';

    let { editor, view, node, getPos }: SlotViewProps = $props();

    // The node view skips updates during IME composition, so composition events drive this flag to keep the
    // placeholder off the live IME text
    let composing = $state(false);

    // the absolute placeholder takes no space, so its width becomes the slot's minimum width
    let placeholderWidth = $state<number>();
    let placeholderElement = $state<HTMLSpanElement>();

    const placeholder = $derived((node.attrs.placeholder as string | null) || '');
    const showPlaceholder = $derived(node.textContent === strings.ZERO_WIDTH_CHAR && !composing);

    $effect(() => {
        // re-measured when the text changes
        void placeholder;
        if (!showPlaceholder) {
            return;
        }
        const timer = setTimeout(() => (placeholderWidth = placeholderElement?.offsetWidth));
        return () => clearTimeout(timer);
    });

    // capture phase: ProseMirror may stop propagation
    $effect(() => {
        const offStart = on(
            view.dom,
            'compositionstart',
            () => {
                if (isSelectionInsideNode(editor.state.selection, getPos(), node.nodeSize)) {
                    composing = true;
                }
            },
            { capture: true }
        );
        const offEnd = on(view.dom, 'compositionend', () => (composing = false), { capture: true });
        return () => {
            offStart();
            offEnd();
        };
    });
</script>

<span class="input-slot" style:min-width={showPlaceholder && placeholderWidth ? `${placeholderWidth}px` : undefined} style:white-space="normal">
    <!-- hidden with display instead of unmounted so the DOM stays stable during IME updates -->
    <span bind:this={placeholderElement} class="input-slot-placeholder" contenteditable="false" data-placeholder="" style:display={showPlaceholder ? undefined : 'none'}>{placeholder}</span>
    <span class="content" data-node-view-content="" style:white-space="pre-wrap"></span>
</span>
