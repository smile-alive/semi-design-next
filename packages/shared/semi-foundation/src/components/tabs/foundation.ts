import { isEqual } from 'es-toolkit';
import { BaseFoundation, type DefaultAdapter, type DirectionContext } from '../../base/index';
import { cssClasses, TAB_DATA_KEY_PREFIX, TAB_KEY_ATTRIBUTE } from './constants';

/** What the previous update showed, so the pane motion is derived in the same update as the key change */
export interface MotionView {
    activeKey: string | null;
    /** The key selected before activeKey, null on mount */
    prevActiveKey: string | null;
    propsActiveKey?: string | null;
    paneKeys: ReadonlyArray<string | null | undefined>;
    forceDisableMotion: boolean;
}

export type MotionViewInput = Pick<MotionView, 'activeKey' | 'propsActiveKey' | 'paneKeys'>;

/** The members of a keyboard event the foundation reads; DOM and synthetic events both satisfy it */
export type TabKeyEvent = Pick<KeyboardEvent, 'key' | 'altKey' | 'ctrlKey' | 'metaKey' | 'target' | 'currentTarget' | 'preventDefault' | 'stopPropagation'>;

export interface PaneMotionInput {
    itemKey?: string;
    activeKey: string | null;
    prevActiveKey: string | null;
    paneKeys: ReadonlyArray<string | undefined>;
    tabPosition: 'top' | 'left';
    tabPaneMotion: boolean;
    /** A pane added and selected by the same update shows without sliding in */
    forceDisableMotion: boolean;
}

/** E is the host's click event type, which the foundation only passes through */
export interface TabsAdapter<P extends TabsBaseProps = TabsBaseProps, E = unknown> extends DefaultAdapter<P, TabsState, DirectionContext> {
    notifyTabClick: (activeKey: string, event: E) => void;
    notifyChange: (activeKey: string) => void;
    notifyTabDelete: (tabKey: string) => void;
}

interface TabEntry {
    itemKey?: string;
    disabled?: boolean;
}

export interface TabsBaseProps {
    activeKey?: string | null;
    tabPosition?: 'top' | 'left';
    preventScroll?: boolean;
}

export interface TabsState {
    activeKey: string | null;
}

export default class TabsFoundation<P extends TabsBaseProps = TabsBaseProps, E = unknown> extends BaseFoundation<TabsAdapter<P, E>, P, TabsState> {
    static override readonly propKeys = ['activeKey'];

    #notifyChange(activeKey: string) {
        const { activeKey: stateActiveKey } = this.getStates();
        if (stateActiveKey !== activeKey) {
            this.adapter.notifyChange(activeKey);
        }
    }

    #handlePrevent(event: TabKeyEvent) {
        event.stopPropagation();
        event.preventDefault();
    }

    #handleArrowKey(event: TabKeyEvent, tab: HTMLElement, allTabs: HTMLElement[]) {
        const { tabPosition } = this.getProps();
        const isVertical = tabPosition === 'left';

        if (isVertical) {
            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                this.#switchTabOnArrowPress(event.key, tab, allTabs);
                this.#handlePrevent(event);
            }
        } else {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                this.#switchTabOnArrowPress(event.key, tab, allTabs);
                this.#handlePrevent(event);
            }
        }
    }

    #handleDeleteKeyDown(event: TabKeyEvent, tab: HTMLElement, tabs: HTMLElement[], itemKey: string, closable: boolean) {
        const { preventScroll } = this.getProps();
        // a disabled tab can hold focus after a click
        if (closable && tab.getAttribute('aria-disabled') !== 'true') {
            // WebKit navigates back on Backspace outside an editable field
            this.#handlePrevent(event);
            this.handleTabDelete(itemKey);
            const index = tabs.indexOf(tab);
            if (tabs.length !== 1) {
                tabs[index + 1 >= tabs.length ? index - 1 : index + 1].focus({ preventScroll });
            }
        }
    }

    // Walks the full tab list, disabled tabs included: a disabled tab can hold focus, and the move must start from it
    #switchTabOnArrowPress(key: string, tab: HTMLElement, allTabs: HTMLElement[]) {
        const { preventScroll } = this.getProps();
        const rtl = this.adapter.getContext('direction') === 'rtl';
        const step = { ArrowLeft: rtl ? 1 : -1, ArrowUp: -1, ArrowRight: rtl ? -1 : 1, ArrowDown: 1 }[key];
        const start = allTabs.indexOf(tab);
        for (let offset = 1; offset < allTabs.length; offset++) {
            const candidate = allTabs[(start + step * offset + allTabs.length) % allTabs.length];
            if (candidate.getAttribute('aria-disabled') !== 'true') {
                candidate.focus({ preventScroll });
                return;
            }
        }
    }

    protected handleNewActiveKey(activeKey: string | null) {
        const { activeKey: stateActiveKey } = this.getStates();
        if (stateActiveKey !== activeKey) {
            this.setState({ activeKey });
        }
    }

    /** `list` is the panes the initial key may pick from, which only the host can read */
    static getInitialState(props: { activeKey?: string | null; defaultActiveKey?: string }, list: ReadonlyArray<TabEntry | null>): TabsState {
        return { activeKey: TabsFoundation.getDefaultActiveKey(props, list) };
    }

    static getDefaultActiveKey(props: { activeKey?: string | null; defaultActiveKey?: string }, list: ReadonlyArray<TabEntry | null>): string | null {
        if (props.activeKey !== undefined) {
            return props.activeKey;
        }
        if (props.defaultActiveKey !== undefined) {
            return props.defaultActiveKey;
        }
        return list.find((item) => item && !item.disabled && item.itemKey)?.itemKey ?? '';
    }

    /**
     * A tablist needs exactly one Tab stop. The selected tab holds it; when none of `tabs` is selected (activeKey is
     * null, matches no tab, or the tab sits in the more menu), the first enabled one takes it.
     */
    static getTabbableKey(tabs: ReadonlyArray<TabEntry>, activeKey: string | null): string | undefined {
        if (tabs.some((tab) => tab.itemKey === activeKey)) {
            return undefined;
        }
        return tabs.find((tab) => !tab.disabled)?.itemKey;
    }

    static getPaneMotion({ itemKey, activeKey, prevActiveKey, paneKeys, tabPosition, tabPaneMotion, forceDisableMotion }: PaneMotionInput) {
        const activeIndex = activeKey === null ? -1 : paneKeys.indexOf(activeKey);
        const itemIndex = itemKey === undefined ? -1 : paneKeys.indexOf(itemKey);
        const prevIndex = prevActiveKey === null ? -1 : paneKeys.indexOf(prevActiveKey);
        const fromEnd = itemIndex !== -1 && activeIndex !== -1 && (activeIndex === itemIndex ? prevIndex > activeIndex : itemIndex < activeIndex);
        const startClassName = tabPosition === 'top' ? (fromEnd ? cssClasses.TABS_PANE_ANIMATE_RIGHT_SHOW : cssClasses.TABS_PANE_ANIMATE_LEFT_SHOW) : fromEnd ? cssClasses.TABS_PANE_ANIMATE_BOTTOM_SHOW : cssClasses.TABS_PANE_ANIMATE_TOP_SHOW;
        // a pane selected because the previous one was removed appears without sliding in
        const hasMotion = tabPaneMotion && itemKey === activeKey && prevIndex !== -1 && !forceDisableMotion;
        return { startClassName, hasMotion };
    }

    /** The next MotionView; `prev` itself when nothing it records changed, so hosts can compare by reference */
    static getMotionView(prev: MotionView | undefined, { activeKey, propsActiveKey, paneKeys }: MotionViewInput) {
        if (!prev) {
            return { activeKey, prevActiveKey: null, propsActiveKey, paneKeys, forceDisableMotion: false };
        }
        if (activeKey === prev.activeKey && propsActiveKey === prev.propsActiveKey && isEqual(paneKeys, prev.paneKeys)) {
            return prev;
        }
        return {
            activeKey,
            prevActiveKey: activeKey === prev.activeKey ? prev.prevActiveKey : prev.activeKey,
            propsActiveKey,
            paneKeys,
            forceDisableMotion: propsActiveKey === prev.propsActiveKey ? prev.forceDisableMotion : paneKeys.includes(propsActiveKey) && !prev.paneKeys.includes(propsActiveKey),
        };
    }

    static splitMore<T>(list: readonly T[], more: number | { count: number }) {
        if (typeof more !== 'number' && typeof more !== 'object') {
            throw new Error('[Semi Tabs]: invalid tab props format: more');
        }
        const keep = list.length - Math.min(typeof more === 'number' ? more : more.count, list.length);
        return { kept: list.slice(0, keep), moved: list.slice(keep) };
    }

    handleTabClick = (activeKey: string, event: E) => {
        this.#notifyChange(activeKey);
        if (!this.isControlledComponent('activeKey')) {
            this.handleNewActiveKey(activeKey);
        }
        this.adapter.notifyTabClick(activeKey, event);
    };

    // an activeKey that goes back to undefined keeps the last controlled key, which later uncontrolled clicks continue from
    override handlePropsChange() {
        const { activeKey } = this.getProps();
        if (activeKey !== undefined) {
            this.handleNewActiveKey(activeKey);
        }
    }

    // panes can leave after mount: an uncontrolled key no longer among them moves to the first enabled one
    handleTabPanesChange = (panes: ReadonlyArray<TabEntry>) => {
        if (this.isControlledComponent('activeKey')) {
            return;
        }
        const { activeKey } = this.getStates();
        if (!panes.some((pane) => pane.itemKey === activeKey)) {
            this.handleNewActiveKey(TabsFoundation.getDefaultActiveKey({}, panes));
        }
    };

    handleTabDelete = (tabKey: string) => {
        this.adapter.notifyTabDelete(tabKey);
    };

    handleKeyDown = (event: E & TabKeyEvent, itemKey: string, closable: boolean) => {
        // with a modifier the key is a browser or system shortcut (Alt+ArrowLeft goes back), not tab navigation
        if (event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }
        const tab = event.currentTarget;
        // a key pressed in a control inside the tab bubbles here but belongs to that control
        if (!(tab instanceof HTMLElement) || event.target !== tab) {
            return;
        }
        const { preventScroll } = this.getProps();
        // siblings are found through the tablist, not the parent: a tab can be wrapped (OverflowList wraps each one)
        const allTabs = [...tab.closest('[role="tablist"]').querySelectorAll<HTMLElement>(`[${TAB_KEY_ATTRIBUTE}^="${TAB_DATA_KEY_PREFIX}"]`)];
        const tabs = allTabs.filter((item) => item.getAttribute('aria-disabled') !== 'true');

        switch (event.key) {
            case 'ArrowLeft':
            case 'ArrowRight':
            case 'ArrowUp':
            case 'ArrowDown':
                this.#handleArrowKey(event, tab, allTabs);
                break;
            case 'Backspace':
            case 'Delete':
                this.#handleDeleteKeyDown(event, tab, tabs, itemKey, closable);
                break;
            case 'Enter':
            case ' ':
                if (tab.getAttribute('aria-disabled') === 'true') {
                    break;
                }
                this.handleTabClick(itemKey, event);
                this.#handlePrevent(event);
                break;
            case 'Home':
                // empty when every tab is disabled
                tabs[0]?.focus({ preventScroll });
                this.#handlePrevent(event);
                break;
            case 'End':
                tabs.at(-1)?.focus({ preventScroll });
                this.#handlePrevent(event);
                break;
        }
    };
}
