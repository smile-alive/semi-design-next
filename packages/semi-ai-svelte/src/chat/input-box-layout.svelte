<script lang="ts">
    import type { Snippet } from 'svelte';
    import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';

    interface InputBoxLayoutProps {
        class?: string;
        style?: string;
        clear?: Snippet;
        upload?: Snippet;
        input: Snippet;
        send: Snippet;
        onInnerClick: () => void;
    }

    let { class: className, style, clear, upload, input, send, onInnerClick }: InputBoxLayoutProps = $props();

    const { PREFIX_INPUT_BOX } = cssClasses;
</script>

<div class={[PREFIX_INPUT_BOX, className]} {style}>
    <!-- a click anywhere in the box focuses the textarea; the controls inside keep their own keyboard operation -->
    <div class="{PREFIX_INPUT_BOX}-inner" role="presentation" onclick={onInnerClick}>
        {@render clear?.()}
        <div class="{PREFIX_INPUT_BOX}-container">
            {@render upload?.()}
            {@render input()}
            {@render send()}
        </div>
    </div>
</div>
