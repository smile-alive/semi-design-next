import { useInsertionEffect, useLayoutEffect, useMemo, useState } from 'react';
import { isEqual } from 'es-toolkit';
import BreakpointObserver, { noScreens } from '@fibrae/semi-foundation/config-provider/breakpoint-observer';
import { inheritConfig, switchesDirection } from '@fibrae/semi-foundation/config-provider/inherit-config';
import type { ResponsiveMap, BreakpointScreens } from '@fibrae/semi-foundation/config-provider/responsive-types';
import { defaultResponsiveMap } from '@fibrae/semi-foundation/grid/constants';
import { ConfigContext, useConfigContext, type ContextValue } from './context';

export interface ConfigProviderProps extends Omit<ContextValue, 'onBreakpoint' | 'screens'> {
    /**
     * Custom responsive map configuration
     * If not provided, default responsive map will be used
     */
    responsiveMap?: ResponsiveMap;

    /**
     * Enable responsive observing in ConfigProvider.
     *
     * - When false (default): ConfigProvider will not register any matchMedia listeners.
     * - When true: listeners will be registered lazily on first subscription.
     */
    responsiveObserve?: boolean;
}

export { defaultResponsiveMap } from '@fibrae/semi-foundation/grid/constants';

export const ConfigConsumer = ConfigContext.Consumer;

function ConfigProvider(props: ConfigProviderProps) {
    const outer = useConfigContext();

    const { direction, locale, timeZone, getPopupContainer, responsiveObserve, responsiveMap: givenMap } = inheritConfig(props, outer);

    // an inline map literal is a new object every render; keep the old one to avoid re-registering media queries
    const [stableMap, setStableMap] = useState(givenMap);
    let responsiveMap = stableMap;

    if (!isEqual(stableMap, givenMap)) {
        setStableMap(givenMap);
        responsiveMap = givenMap;
    }

    const [screens, setScreens] = useState<BreakpointScreens>(noScreens);
    const [observer] = useState(() => new BreakpointObserver({ responsiveObserve, responsiveMap }, setScreens));

    const value = useMemo<ContextValue>(
        () => ({
            locale,
            timeZone,
            getPopupContainer,
            responsiveObserve,
            direction,
            responsiveMap: responsiveMap || defaultResponsiveMap,
            onBreakpoint: observer.subscribe,
            screens,
        }),
        [locale, timeZone, getPopupContainer, responsiveObserve, direction, responsiveMap, observer, screens]
    );

    useInsertionEffect(() => {
        observer.sync({ responsiveObserve, responsiveMap });
    });

    useLayoutEffect(() => {
        observer.commit();
    });

    useLayoutEffect(() => () => observer.destroy(), [observer]);

    return <ConfigContext value={value}>{switchesDirection(props, outer) ? <div dir={direction}>{props.children}</div> : props.children}</ConfigContext>;
}

export default Object.assign(ConfigProvider, {
    /** Default responsive map */
    defaultResponsiveMap,
});

export type { ResponsiveMap, BreakpointScreens, Breakpoint, OnBreakpointScreensCallback, OnBreakpointChangeCallback } from '@fibrae/semi-foundation/config-provider/responsive-types';
