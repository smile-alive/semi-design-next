import { isEqual } from 'es-toolkit';
import { defaultResponsiveMap } from '../grid/constants';
import { registerMediaQuery } from '../utils/dom';
import warning from '../utils/warning';
import type { Breakpoint, BreakpointScreens, OnBreakpointChangeCallback, OnBreakpointScreensCallback, ResponsiveMap } from './responsive-types';

export const noScreens: BreakpointScreens = { xs: false, sm: false, md: false, lg: false, xl: false, xxl: false };

export interface ObserveProps {
    responsiveObserve: boolean;
    responsiveMap?: ResponsiveMap;
}

/**
 * The breakpoint subscriptions behind the context's `onBreakpoint`, created once per provider so `subscribe` keeps
 * one identity; subscribers (called from children's effects) read the props of the commit in progress, which
 * `sync` records before `commit` runs.
 */
export default class BreakpointObserver {
    #unRegisters: Array<() => void> = [];
    #registered = false;
    #warned = false;
    readonly #screensListeners = new Set<OnBreakpointScreensCallback>();
    readonly #changeListeners = new Set<{ breakpoints?: Breakpoint[]; callback: OnBreakpointChangeCallback }>();
    readonly #render: (screens: BreakpointScreens) => void;
    #committed: ObserveProps;
    // synchronous source of truth; render reads the copy in state
    #screens = noScreens;
    #props: ObserveProps;

    constructor(props: ObserveProps, render: (screens: BreakpointScreens) => void) {
        this.#props = props;
        this.#committed = props;
        this.#render = render;
    }

    #unregisterIfIdle() {
        if (this.#props.responsiveObserve && this.#screensListeners.size === 0 && this.#changeListeners.size === 0) {
            this.#unregister();
        }
    }

    #ensureRegistered() {
        if (!this.#props.responsiveObserve) {
            if (!this.#warned) {
                this.#warned = true;
                warning(true, '[Semi] ConfigProvider responsive observing is disabled by default. ' + 'Set <ConfigProvider responsiveObserve> to enable breakpoint subscriptions.');
            }
            return;
        }
        if (this.#screensListeners.size === 0 && this.#changeListeners.size === 0) {
            return;
        }
        if (!this.#registered) {
            this.#register();
        }
    }

    #register() {
        if (this.#registered) {
            return;
        }
        const responsiveMap = this.#props.responsiveMap || defaultResponsiveMap;
        const keys = Object.keys(responsiveMap) as Breakpoint[];
        const screens = { ...noScreens };
        if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
            for (const screen of keys) {
                screens[screen] = window.matchMedia(responsiveMap[screen]).matches;
            }
        }
        // unchanged matches keep the screens object, so consumers do not re-render
        if (!isEqual(screens, this.#screens)) {
            this.#screens = screens;
            this.#render(screens);
        }
        this.#unRegisters = keys.map((screen) =>
            registerMediaQuery(responsiveMap[screen], {
                match: () => this.#update(screen, true),
                unmatch: () => this.#update(screen, false),
                callInInit: false,
            })
        );
        this.#registered = true;
    }

    #unregister() {
        for (const unRegister of this.#unRegisters) {
            unRegister();
        }
        this.#unRegisters = [];
        this.#registered = false;
    }

    #update(screen: Breakpoint, matches: boolean) {
        if (this.#screens[screen] !== matches) {
            this.#screens = { ...this.#screens, [screen]: matches };
            this.#render(this.#screens);
        }
        const screens = this.#screens;
        this.#screensListeners.forEach((listener) => listener(screens));
        this.#changeListeners.forEach(({ breakpoints, callback }) => {
            if (!breakpoints || breakpoints.includes(screen)) {
                callback(screen, matches);
            }
        });
    }

    sync = (props: ObserveProps) => {
        this.#props = props;
    };

    commit = () => {
        const prev = this.#committed;
        const props = this.#props;
        const prevScreens = this.#screens;
        this.#committed = props;
        if (prev.responsiveObserve && !props.responsiveObserve) {
            this.#unregister();
        }
        if (this.#registered && prev.responsiveMap !== props.responsiveMap) {
            this.#unregister();
            this.#register();
        }
        if (!prev.responsiveObserve && props.responsiveObserve) {
            this.#ensureRegistered();
        }
        // #register replaces #screens only when the matches differ
        if (this.#screens !== prevScreens) {
            const screens = this.#screens;
            this.#screensListeners.forEach((listener) => listener(screens));
            const changed = (Object.keys(screens) as Breakpoint[]).filter((screen) => screens[screen] !== prevScreens[screen]);
            this.#changeListeners.forEach(({ breakpoints, callback }) => {
                for (const screen of changed) {
                    if (!breakpoints || breakpoints.includes(screen)) {
                        callback(screen, screens[screen]);
                    }
                }
            });
        }
    };

    destroy = () => {
        this.#unregister();
        this.#screensListeners.clear();
        this.#changeListeners.clear();
    };

    subscribe: {
        (callback: OnBreakpointScreensCallback): () => void;
        (breakpoints: Breakpoint[], callback: OnBreakpointChangeCallback): () => void;
    } = (arg1: OnBreakpointScreensCallback | Breakpoint[], arg2?: OnBreakpointChangeCallback) => {
        if (typeof arg1 === 'function') {
            this.#screensListeners.add(arg1);
            this.#ensureRegistered();
            arg1(this.#screens);
            return () => {
                this.#screensListeners.delete(arg1);
                this.#unregisterIfIdle();
            };
        }
        const breakpoints = Array.isArray(arg1) ? arg1 : undefined;
        const entry = { breakpoints, callback: arg2 };
        this.#changeListeners.add(entry);
        this.#ensureRegistered();
        if (breakpoints && typeof arg2 === 'function') {
            const screens = this.#screens;
            breakpoints.forEach((bp) => arg2(bp, screens[bp]));
        }
        return () => {
            this.#changeListeners.delete(entry);
            this.#unregisterIfIdle();
        };
    };
}
