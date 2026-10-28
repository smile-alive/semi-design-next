import { type JSX, createSignal, onCleanup, onMount, untrack } from 'solid-js';
import Collapsible from '../collapsible';

interface NodeCollapsibleProps {
    open: boolean;
    motion: boolean;
    duration: number;
    onMotionEnd?: () => void;
    children?: JSX.Element;
}

/**
 * Mounts in the `open` state and flips it once right after, so Collapsible animates the rows in or out. Later `open`
 * changes are ignored on purpose: the motion must not reverse, nor reopen rows that were collapsed.
 */
export default function NodeCollapsible(props: NodeCollapsibleProps) {
    // the mount state only, see above
    const [isOpen, setIsOpen] = createSignal(untrack(() => props.open));

    // the flip has to land after the mounted state for Collapsible to animate between them
    onMount(() => {
        const timer = setTimeout(() => setIsOpen((open) => !open), 0);
        onCleanup(() => clearTimeout(timer));
    });

    return (
        <Collapsible duration={props.duration} isOpen={isOpen()} motion={props.motion} onMotionEnd={() => props.onMotionEnd?.()}>
            {props.children}
        </Collapsible>
    );
}
