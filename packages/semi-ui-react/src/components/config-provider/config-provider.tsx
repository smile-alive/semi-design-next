import { useInsertionEffect, useLayoutEffect, useMemo, useState } from 'react';
import { isEqual } from 'es-toolkit';
import BreakpointObserver, { noScreens } from '@fibrae/semi-foundation/components/config-provider/breakpoint-observer';
import { inheritConfig, switchesDirection } from '@fibrae/semi-foundation/components/config-provider/inherit-config';
import type { ResponsiveMap, BreakpointScreens } from '@fibrae/semi-foundation/components/config-provider/responsive-types';
import { defaultResponsiveMap } from '@fibrae/semi-foundation/components/grid/constants';
import { ConfigContext, useConfigContext, type ContextValue } from './context';

export interface ConfigProviderProps extends Omit<ContextValue, 'onBreakpoint' | 'screens'> {
    responsiveMap?: ResponsiveMap;

    /** When false (default), no matchMedia listener is registered; when true, listeners register lazily on first subscription */
    responsiveObserve?: boolean;
}

export { defaultResponsiveMap } from '@fibrae/semi-foundation/components/grid/constants';

export const ConfigConsumer = ConfigContext.Consumer;

function ConfigProvider(props: ConfigProviderProps) {
    const outer = useConfigContext();

    const { direction, locale, dateFnsLocale, timeZone, getPopupContainer, responsiveObserve, responsiveMap: givenMap } = inheritConfig(props, outer);

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
            dateFnsLocale,
            timeZone,
            getPopupContainer,
            responsiveObserve,
            direction,
            responsiveMap: responsiveMap || defaultResponsiveMap,
            onBreakpoint: observer.subscribe,
            screens,
        }),
        [locale, dateFnsLocale, timeZone, getPopupContainer, responsiveObserve, direction, responsiveMap, observer, screens]
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
    defaultResponsiveMap,
});

export type { ResponsiveMap, BreakpointScreens, Breakpoint, OnBreakpointScreensCallback, OnBreakpointChangeCallback } from '@fibrae/semi-foundation/components/config-provider/responsive-types';
