import { useEffect, useState } from 'react';
import { noScreens, readScreens, subscribeScreens } from '@fibrae/semi-foundation/components/config-provider/breakpoint-observer';
import type { BreakpointScreens } from '@fibrae/semi-foundation/components/config-provider/responsive-types';

/**
 * Which breakpoints of `defaultResponsiveMap` match the viewport; `xs` is a max-width query here, while Row's `xs` applies
 * at every width. Every breakpoint is false on the server and in the first client render, then the real matches arrive
 * after mount.
 */
export default function useBreakpoint(): BreakpointScreens {
    const [screens, setScreens] = useState(noScreens);

    useEffect(() => {
        const update = () => setScreens(readScreens());
        update();
        return subscribeScreens(update);
    }, []);

    return screens;
}
