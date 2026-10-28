import type { Locale } from '../locale/interface';
import type { ResponsiveMap } from './responsive-types';

export interface InheritableConfig {
    direction?: 'ltr' | 'rtl';
    timeZone?: string | number;
    locale?: Locale | null;
    getPopupContainer?: () => HTMLElement;
    responsiveObserve?: boolean;
    responsiveMap?: ResponsiveMap;
}

export interface InheritedConfig extends InheritableConfig {
    direction: 'ltr' | 'rtl';
    responsiveObserve: boolean;
}

/**
 * A ConfigProvider's own value wins over the enclosing one whenever it is not `undefined`. `null` counts as a value so
 * that `locale={null}` clears the inherited locale and lets a LocaleProvider below through.
 */
export function inheritConfig(own: InheritableConfig, outer: InheritableConfig): InheritedConfig {
    const pick = <K extends keyof InheritableConfig>(key: K) => (own[key] !== undefined ? own[key] : outer[key]);
    return {
        direction: pick('direction') ?? 'ltr',
        timeZone: pick('timeZone'),
        locale: pick('locale'),
        getPopupContainer: pick('getPopupContainer'),
        responsiveObserve: pick('responsiveObserve') ?? false,
        responsiveMap: pick('responsiveMap'),
    };
}

/**
 * RTL styles match `:dir()`, which only follows the `dir` attribute of the DOM ancestors, so a different direction
 * needs a wrapper element that carries it.
 */
export function switchesDirection(own: InheritableConfig, outer: InheritableConfig) {
    return own.direction !== undefined && own.direction !== outer.direction;
}
