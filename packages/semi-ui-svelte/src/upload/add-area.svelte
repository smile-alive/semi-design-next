<script lang="ts">
    import type { Snippet } from 'svelte';
    import type { Attachment } from 'svelte/attachments';
    import type { HTMLAttributes } from 'svelte/elements';
    import { addAreaControlAttributes, containsControl, containsName } from '@fibrae/semi-foundation/upload/utils';
    import useLocale from '../locale/use-locale.svelte.js';

    interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'tabindex'> {
        disabled: boolean;
        tabindex?: number;
        onOpen: () => void;
        children?: Snippet;
    }

    let { disabled, tabindex, onOpen, children, ...rest }: Props = $props();

    const locale = useLocale('Upload');

    // A control inside a button is invalid nesting with two Tab stops, so a slotted control becomes the button and its
    // click bubbles up. Watched while mounted since the content may change at any time. Shortcut: the content is
    // inspected after mount, so the server HTML always has role="button" around it; upgrade by letting Semi controls
    // register with the area during their own initialization (as the Solid package does).
    let hasControl = $state(false);
    let hasName = $state(true);

    const observe: Attachment<HTMLDivElement> = (node) => {
        const update = () => {
            hasControl = containsControl(node);
            hasName = containsName(node);
        };
        update();
        const observer = new MutationObserver(update);
        observer.observe(node, { subtree: true, childList: true, characterData: true, attributeFilter: addAreaControlAttributes });
        return () => observer.disconnect();
    };

    const handleKeydown = (event: KeyboardEvent) => {
        if (hasControl || event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) {
            return;
        }
        // Space would otherwise scroll the page
        event.preventDefault();
        onOpen();
    };
</script>

<div {...rest} {@attach observe} aria-disabled={hasControl ? undefined : disabled} aria-label={hasControl || hasName ? undefined : locale().locale.upload} role={hasControl ? undefined : 'button'} tabindex={hasControl ? undefined : (tabindex ?? 0)} onclick={onOpen} onkeydown={handleKeydown}>
    {@render children?.()}
</div>
