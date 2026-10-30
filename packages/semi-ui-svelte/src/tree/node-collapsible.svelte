<script lang="ts">
    import { type Snippet, onMount, untrack } from 'svelte';
    import Collapsible from '../collapsible/collapsible.svelte';

    interface NodeCollapsibleProps {
        open: boolean;
        motion: boolean;
        duration: number;
        onMotionEnd?: () => void;
        children: Snippet;
    }

    /**
     * Mounts in the `open` state and flips it once right after, so Collapsible animates the rows in or out. Later `open`
     * changes are ignored on purpose: the motion must not reverse, nor reopen rows that were collapsed.
     */
    let { open, motion, duration, onMotionEnd, children }: NodeCollapsibleProps = $props();

    let isOpen = $state(untrack(() => open));

    // the flip has to land after the mounted state for Collapsible to animate between them
    onMount(() => {
        const timer = setTimeout(() => {
            isOpen = !isOpen;
        }, 0);
        return () => clearTimeout(timer);
    });
</script>

<Collapsible {duration} {isOpen} {motion} {onMotionEnd}>
    {@render children()}
</Collapsible>
