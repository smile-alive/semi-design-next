import { type Accessor, createSignal, onCleanup, onMount } from 'solid-js';
import { noScreens, readScreens, subscribeScreens } from '@fibrae/semi-foundation/components/config-provider/breakpoint-observer';
import type { BreakpointScreens } from '@fibrae/semi-foundation/components/config-provider/responsive-types';

/**
 * Which breakpoints of `defaultResponsiveMap` match the viewport; `xs` is a max-width query here, while Row's `xs` applies
 * at every width. Every breakpoint is false on the server and in the first client render, then the real matches arrive
 * after mount.
 */
export default function useBreakpoint(): Accessor<BreakpointScreens> {
    const [screens, setScreens] = createSignal(noScreens);

    onMount(() => {
        const update = () => setScreens(readScreens());
        update();
        onCleanup(subscribeScreens(update));
    });

    return screens;
}
