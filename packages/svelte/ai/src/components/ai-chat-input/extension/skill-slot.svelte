<script lang="ts">
    import { IconClose } from '@fibrae/semi-icons-svelte';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import type { SlotViewProps } from './node-view.svelte.js';

    let { editor, node, deleteNode }: SlotViewProps = $props();

    const locale = useLocale('AIChatInput');

    const label = $derived((node.attrs.label as string | null) ?? (node.attrs.value as string | null) ?? '');

    // stopped: the container's click would move focus to the editor's end
    const handleRemove = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        deleteNode();
        // the button leaves with the slot, so focus would otherwise fall to the body
        editor.commands.focus();
    };
</script>

{#if label !== ''}
    <span class="skill-slot-wrapper" style="white-space: normal">
        <span class="skill-slot">
            {label}
            <button aria-label={locale().locale.removeSkill} class="skill-slot-delete" type="button" onclick={handleRemove}>
                <IconClose />
            </button>
        </span>
    </span>
{/if}
