import { type JSX, Show, createComputed, createEffect, createMemo, createSignal, on, onCleanup, onMount, untrack } from 'solid-js';
import { isEqual } from 'es-toolkit';
import BreakpointObserver, { noScreens } from '@fibrae/semi-foundation/config-provider/breakpoint-observer';
import { inheritConfig, switchesDirection } from '@fibrae/semi-foundation/config-provider/inherit-config';
import type { ResponsiveMap } from '@fibrae/semi-foundation/config-provider/responsive-types';
import { defaultResponsiveMap } from '@fibrae/semi-foundation/grid/constants';
import shallowEqualObjects from '@fibrae/semi-foundation/utils/shallow-equal-objects';
import { ConfigContext, type ContextValue, useConfigContext } from './context';

export interface ConfigProviderProps extends Omit<ContextValue, 'onBreakpoint' | 'screens'> {
    /** Custom breakpoints; the default responsive map applies when omitted */
    responsiveMap?: ResponsiveMap;
    /** Registers matchMedia listeners, lazily on the first subscription; off by default */
    responsiveObserve?: boolean;
    children?: JSX.Element;
}

export default function ConfigProvider(props: ConfigProviderProps) {
    const outer = useConfigContext();

    const [screens, setScreens] = createSignal(noScreens);

    const inherited = createMemo(() => inheritConfig(props, outer()));

    // An inline map literal is a new object on every change; keep the old one to avoid re-registering media queries
    const stableMap = createMemo(() => inherited().responsiveMap, undefined, { equals: isEqual });
    const observation = createMemo(() => ({ responsiveObserve: inherited().responsiveObserve, responsiveMap: stableMap() }));

    const observer = new BreakpointObserver(untrack(observation), setScreens);

    const value = createMemo(
        (): ContextValue => ({
            direction: inherited().direction,
            locale: inherited().locale,
            timeZone: inherited().timeZone,
            getPopupContainer: inherited().getPopupContainer,
            responsiveObserve: inherited().responsiveObserve,
            responsiveMap: stableMap() || defaultResponsiveMap,
            screens: screens(),
            onBreakpoint: observer.subscribe,
        }),
        undefined,
        { equals: shallowEqualObjects }
    );

    // Subscriptions from descendants' effects must see the new configuration, so it is recorded before rendering
    createComputed(on(observation, (next) => observer.sync(next), { defer: true }));
    createEffect(on(observation, () => observer.commit(), { defer: true }));

    onMount(() => observer.commit());
    onCleanup(() => observer.destroy());

    return (
        <ConfigContext.Provider value={value}>
            {/* Each branch reads props.children: children() in the body would create the descendants outside this
                Provider. Toggling the wrapper remounts them, as in React and Vue */}
            <Show when={switchesDirection(props, outer())} fallback={props.children}>
                <div dir={inherited().direction}>{props.children}</div>
            </Show>
        </ConfigContext.Provider>
    );
}
