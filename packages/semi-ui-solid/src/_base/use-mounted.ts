import { type Accessor, createSignal, onMount } from 'solid-js';

/** `false` on the server and during hydration, `true` once the component is mounted; gates what only the browser can render */
export default function useMounted(): Accessor<boolean> {
    // Waits for mount even outside hydration: callers query the inserted DOM for their container, which an
    // "is hydrating" check cannot stand in for
    const [mounted, setMounted] = createSignal(false);

    onMount(() => setMounted(true));

    return mounted;
}
