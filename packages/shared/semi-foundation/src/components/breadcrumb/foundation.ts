import { BaseFoundation, type DefaultAdapter } from '../../base/index';
import { isEnterPress } from '../../utils/index';
import type { Route } from './item-foundation';

export interface BreadcrumbState {
    isCollapsed: boolean;
}

export interface BreadcrumbAdapter<P extends object = object> extends DefaultAdapter<P, BreadcrumbState> {
    /**
     * Called right before the more button disappears. A host that cannot hand focus over by node removal records it
     * here; the returned function runs once the expansion is committed.
     */
    holdFocus?: () => (() => void) | undefined;
}

export default class BreadcrumbFoundation<P extends object = object> extends BaseFoundation<BreadcrumbAdapter<P>, P, BreadcrumbState> {
    static getInitialState(): BreadcrumbState {
        return { isCollapsed: true };
    }

    /** Normalizes string routes to `{ name }` and keeps the caller's object in `_origin`; pure, called during render */
    static genRoutes(routes: Array<Route | string>): Array<Route & { _origin: Route }> {
        return routes.map((route) => (typeof route === 'object' ? { _origin: route, ...route } : { name: route, _origin: { name: route } }));
    }

    /**
     * Inclusive index range hidden behind the more button; empty when `end < start`.
     * The first and last item always stay. A current item inside the default range keeps visible by hiding the
     * longer run beside it instead, the earlier one on a tie.
     */
    static getCollapseRange(total: number, maxItemCount: number, activeIndex?: number) {
        const hiddenCount = Math.min(total - maxItemCount, total - 2);
        if (activeIndex === undefined || activeIndex < 1 || activeIndex > hiddenCount) {
            return { start: 1, end: hiddenCount };
        }
        const afterCount = Math.min(hiddenCount, total - 2 - activeIndex);
        if (activeIndex - 1 >= afterCount) {
            return { start: 1, end: activeIndex - 1 };
        }
        return { start: activeIndex + 1, end: activeIndex + afterCount };
    }

    /** Whether the more button stands in for the range; an empty range (`end < start`) has nothing to hide */
    static shouldCollapse(autoCollapse: boolean | undefined, { start, end }: { start: number; end: number }, isCollapsed: boolean) {
        return Boolean(autoCollapse) && end >= start && isCollapsed;
    }

    /** `activeIndex` marks the current item; without it the last one is current */
    static isActive(index: number, total: number, activeIndex?: number) {
        return activeIndex !== undefined ? activeIndex === index : index === total - 1;
    }

    /** No separator after the last item, nor after one hidden behind a custom more area or the popover */
    static shouldRenderSeparator(index: number, total: number, { collapsed, start, end, hasCustomMore, moreType }: { collapsed: boolean; start: number; end: number; hasCustomMore: boolean; moreType?: string }) {
        const hidden = collapsed && (hasCustomMore || moreType === 'popover') && index >= start && index <= end;
        return index !== total - 1 && !hidden;
    }

    handleExpand = () => {
        this.setState({ isCollapsed: false }, this.adapter.holdFocus?.());
    };

    handleExpandKeyDown = (keyboardEvent: Pick<KeyboardEvent, 'key' | 'target' | 'preventDefault'> & { currentTarget: Node }) => {
        const { target } = keyboardEvent;
        // keys from the popover content bubble here through the React tree
        if (!(target instanceof Node && keyboardEvent.currentTarget.contains(target))) {
            return;
        }
        if (isEnterPress(keyboardEvent) || keyboardEvent.key === ' ') {
            keyboardEvent.preventDefault(); // Space scrolls the page
            this.handleExpand();
        }
    };
}
