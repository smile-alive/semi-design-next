import BaseFoundation, { type DefaultAdapter } from '../../base/foundation';
import { scrollIntoViewWithin } from '../../utils/supports';
import { cssClasses as overflowListClasses, SCROLL_KEY_ATTRIBUTE } from '../overflow-list/constants';
import { cssClasses, getBarItemKey, getItemKeyByBarItemKey } from './constants';

interface BarTab {
    itemKey: string;
    tab?: unknown;
}

export interface TabBarBaseProps {
    activeKey?: string | null;
    list?: ReadonlyArray<BarTab>;
    collapsible?: boolean | 'auto';
    tabPosition?: 'top' | 'left';
}

export interface TabBarState {
    shouldCollapse: boolean;
}

export interface TabBarAdapter<P extends TabBarBaseProps = TabBarBaseProps> extends DefaultAdapter<P, TabBarState> {
    getBarElement: () => HTMLElement | null | undefined;
    notifyVisibleTabsChange: (visibleState: Map<string, boolean>) => void;
}

const isText = (value: unknown) => typeof value === 'string' || typeof value === 'number';

export default class TabBarFoundation<P extends TabBarBaseProps = TabBarBaseProps> extends BaseFoundation<TabBarAdapter<P>, P, TabBarState> {
    // Bar width at which the tabs overflowed. The collapsed layout can fit every tab at that width, but the uncollapsed
    // one cannot, so leaving the collapse at or below this width would flip-flop between the two.
    #collapsedWidth = 0;
    #isFirstShowInViewport = true;
    #frame = 0;
    // Not taken off the array: OverflowList owns it, and renderArrow and the arrow menu receive the same one
    readonly #arrowClicks = new WeakMap<ReadonlyArray<BarTab>, number>();
    static override readonly propKeys = ['activeKey', 'list'];
    static override readonly propEquals = {
        // a parent re-render hands over a new list of the same tabs; a title that is not text (element, VNode) is a new
        // object each time and counts by key only
        list: (a: ReadonlyArray<BarTab>, b: ReadonlyArray<BarTab>) => a.length === b.length && a.every((pane, i) => pane.itemKey === b[i].itemKey && ((!isText(pane.tab) && !isText(b[i].tab)) || Object.is(pane.tab, b[i].tab))),
    };

    #scrollActiveTabIntoView(position?: ScrollLogicalPosition, behavior?: ScrollBehavior) {
        const { activeKey } = this.getProps();
        if (activeKey != null) {
            TabBarFoundation.scrollTabIntoView(this.adapter.getBarElement(), getBarItemKey(activeKey), position, behavior);
        }
    }

    static getInitialState(): TabBarState {
        return { shouldCollapse: false };
    }

    static isCollapsed(collapsible: boolean | 'auto' | undefined, shouldCollapse: boolean) {
        return collapsible === 'auto' ? shouldCollapse : Boolean(collapsible);
    }

    /** Overflow shows as tabs wrapped into several rows or a scrolled bar; a vertical bar never wraps */
    static isTabsOverflowing(barEl: HTMLElement, tabPosition?: 'top' | 'left') {
        if (tabPosition !== 'left') {
            const tabNodes = [...barEl.querySelectorAll<HTMLElement>(`.${cssClasses.TABS_TAB}`)];
            if (tabNodes.length > 1 && tabNodes.some((node) => node.offsetTop !== tabNodes[0].offsetTop)) {
                return true;
            }
        }
        return barEl.scrollWidth > barEl.clientWidth + 1;
    }

    /** `barItemKey` is the OverflowList scroll key of the tab, see getBarItemKey */
    static scrollTabIntoView(barEl: HTMLElement | null | undefined, barItemKey: string, position: ScrollLogicalPosition = 'nearest', behavior: ScrollBehavior = 'smooth') {
        // only the bar scrolls: the call can land after the page has scrolled past the tabs, and must not pull it back
        const tabEl = barEl?.querySelector(`.${cssClasses.TABS_TAB}[${SCROLL_KEY_ATTRIBUTE}="${CSS.escape(barItemKey)}"]`);
        if (barEl && tabEl) {
            // the collapsed bar scrolls inside OverflowList's wrapper, not the bar element
            scrollIntoViewWithin(tabEl, tabEl.closest<HTMLElement>(`.${overflowListClasses.SCROLL_WRAPPER}`) ?? barEl, { behavior, block: position, inline: position });
        }
    }

    static readVisibleState(visibleMap: ReadonlyMap<string, boolean>) {
        const visibleState = new Map([...visibleMap].map(([barItemKey, visible]) => [getItemKeyByBarItemKey(barItemKey), visible]));
        const visibles = [...visibleState.values()];
        return { visibleState, isShowInViewport: visibles.some(Boolean), hasHidden: visibles.some((visible) => !visible) };
    }

    // ResizeObserver reports after mount as well; this frame is the fallback when it does not fire
    override init() {
        this.#frame = requestAnimationFrame(() => this.checkOverflow());
    }

    override destroy() {
        cancelAnimationFrame(this.#frame);
    }

    override handlePropsChange(prev: Partial<P>) {
        const { activeKey, list, collapsible } = this.getProps();
        if (activeKey !== prev.activeKey && TabBarFoundation.isCollapsed(collapsible, this.getState('shouldCollapse'))) {
            this.#scrollActiveTabIntoView();
        }
        if (!TabBarFoundation.propEquals.list(prev.list ?? [], list ?? [])) {
            // tabs added, removed or retitled change how wide the bar must be, so the remembered width no longer applies
            this.#collapsedWidth = 0;
            this.checkOverflow();
        }
    }

    // Not collapsed yet. Once collapsed, the OverflowList visible-state callback decides whether to leave the collapse,
    // so this only ever turns it on.
    checkOverflow = () => {
        const barEl = this.adapter.getBarElement();
        const { collapsible, tabPosition } = this.getProps();
        if (collapsible !== 'auto' || this.getState('shouldCollapse') || !barEl) {
            return;
        }
        if (TabBarFoundation.isTabsOverflowing(barEl, tabPosition)) {
            this.#collapsedWidth = barEl.clientWidth;
            this.setState({ shouldCollapse: true });
        }
    };

    /** Each click before the next visibility update, which hands over new arrays, steps on to the following hidden tab */
    handleArrowClick = (items: ReadonlyArray<BarTab>, position: 'start' | 'end') => {
        const taken = this.#arrowClicks.get(items) ?? 0;
        this.#arrowClicks.set(items, taken + 1);
        const next = position === 'start' ? items[items.length - 1 - taken] : items[taken];
        if (next) {
            TabBarFoundation.scrollTabIntoView(this.adapter.getBarElement(), getBarItemKey(next.itemKey));
        }
    };

    handleVisibleStateChange = (visibleMap: ReadonlyMap<string, boolean>) => {
        const { visibleState, isShowInViewport, hasHidden } = TabBarFoundation.readVisibleState(visibleMap);
        // only the first appearance in the viewport scrolls the selected tab in: https://github.com/DouyinFE/semi-design/issues/2917
        if (this.#isFirstShowInViewport && isShowInViewport) {
            this.#scrollActiveTabIntoView('nearest', 'auto');
            this.#isFirstShowInViewport = false;
        }
        // all false: the bar is off-screen, which must not change the collapse state
        if (this.getProp('collapsible') === 'auto' && isShowInViewport) {
            const barEl = this.adapter.getBarElement();
            const shouldCollapse = hasHidden || (barEl != null && barEl.clientWidth <= this.#collapsedWidth);
            if (shouldCollapse !== this.getState('shouldCollapse')) {
                this.setState({ shouldCollapse });
            }
        }
        this.adapter.notifyVisibleTabsChange(visibleState);
    };
}
