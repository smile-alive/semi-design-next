import { type Ref, onBeforeUnmount, onMounted, readonly, shallowRef } from 'vue';
import { noScreens, readScreens, subscribeScreens } from '@fibrae/semi-foundation/components/config-provider/breakpoint-observer';
import type { BreakpointScreens } from '@fibrae/semi-foundation/components/config-provider/responsive-types';

/**
 * Which breakpoints of `defaultResponsiveMap` match the viewport; `xs` is a max-width query here, while Row's `xs` applies
 * at every width. Every breakpoint is false on the server and in the first client render, then the real matches arrive
 * after mount.
 */
export default function useBreakpoint(): Readonly<Ref<BreakpointScreens>> {
    const screens = shallowRef(noScreens);
    let unsubscribe: (() => void) | undefined;

    onMounted(() => {
        const update = () => {
            screens.value = readScreens();
        };
        update();
        unsubscribe = subscribeScreens(update);
    });

    onBeforeUnmount(() => unsubscribe?.());

    return readonly(screens);
}
