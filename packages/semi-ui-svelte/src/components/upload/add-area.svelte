<script lang="ts">
    import type { Snippet } from 'svelte';
    import type { HTMLAttributes } from 'svelte/elements';
    import { addAreaObservedAttributes, containsControl, containsName } from '@fibrae/semi-foundation/components/upload/utils';
    import { observeMutations } from '../../utils/index.js';
    import useLocale from '../locale/use-locale.svelte.js';

    interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'tabindex'> {
        disabled: boolean;
        tabindex?: number;
        /** Describes the area only while it is the button; a slotted control is out of its reach */
        describedby?: string;
        /** Whether the content brings its own control, which is then the button */
        hasControl: boolean;
        onOpen: () => void;
        children?: Snippet;
    }

    let { disabled, tabindex, describedby, hasControl = $bindable(), onOpen, children, ...rest }: Props = $props();

    const locale = useLocale('Upload');

    // A control inside a button is invalid nesting with two Tab stops, so a slotted control becomes the button and its
    // click bubbles up. Watched while mounted since the content may change at any time. Shortcut: the content is
    // inspected after mount, so the server HTML always has role="button" around it; upgrade by letting Semi controls
    // register with the area during their own initialization (as the Solid package does).
    let hasName = $state(true);

    const observe = observeMutations(
        (node: HTMLDivElement) => {
            hasControl = containsControl(node);
            hasName = containsName(node);
        },
        { subtree: true, childList: true, characterData: true, attributeFilter: addAreaObservedAttributes }
    );

    const handleKeydown = (event: KeyboardEvent) => {
        if (hasControl || event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) {
            return;
        }
        // Space would otherwise scroll the page
        event.preventDefault();
        onOpen();
    };
</script>

<div
    {...rest}
    {@attach observe}
    aria-describedby={hasControl ? undefined : describedby}
    aria-disabled={hasControl ? undefined : disabled}
    aria-label={hasControl || hasName ? undefined : locale().locale.upload}
    role={hasControl ? undefined : 'button'}
    tabindex={hasControl ? undefined : (tabindex ?? 0)}
    onclick={onOpen}
    onkeydown={handleKeydown}
>
    {@render children?.()}
</div>
