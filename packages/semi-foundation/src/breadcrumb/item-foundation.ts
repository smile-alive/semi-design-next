import { merge } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { DEFAULT_TOOLTIP } from './constants';

export interface BreadcrumbItemInfo {
    name?: any;
    href?: string;
    icon?: any;
    path?: string;
}

export interface Route {
    [x: string]: any;
    path?: string;
    href?: string;
    name?: string;
    icon?: any;
}

/** E is the host's click event, which the foundation only passes through */
export interface BreadcrumbItemAdapter<P extends object = object, S extends object = object, E = unknown> extends DefaultAdapter<P, S> {
    notifyClick: (item: BreadcrumbItemInfo, e: E) => void;
    notifyParent: (item: BreadcrumbItemInfo, e: E) => void;
}

export interface BreadcrumbTooltipConfig {
    width?: string | number;
    ellipsisPos?: 'end' | 'middle';
    opts?: object;
}

export default class BreadcrumbItemFoundation<P extends object = object, S extends object = object, E = unknown> extends BaseFoundation<BreadcrumbItemAdapter<P, S, E>, P, S> {
    /** The title's ellipsis config: `false` keeps the width and position without a tooltip, `true` and objects add one */
    static getTooltipConfig(showTooltip?: boolean | BreadcrumbTooltipConfig): BreadcrumbTooltipConfig {
        if (!showTooltip) {
            return { ...DEFAULT_TOOLTIP };
        }
        // merge writes into its first argument, so the defaults are built per call
        return merge({ ...DEFAULT_TOOLTIP, opts: { autoAdjustOverflow: true, position: 'top' } }, typeof showTooltip === 'object' ? showTooltip : {});
    }

    /**
     * Without an href the item is a span that only reacts to a click handler, so it needs the keyboard operation a link
     * has (see `handleKeyDown`).
     */
    static isKeyboardLink({ active, hasHref, noLink, hasOnClick }: { active?: boolean; hasHref: boolean; noLink?: boolean; hasOnClick: boolean }) {
        return !active && !hasHref && !noLink && hasOnClick;
    }

    handleClick = (item: BreadcrumbItemInfo, e: E) => {
        this._adapter.notifyClick(item, e);
        this._adapter.notifyParent(item, e);
    };

    /** Enter goes through a real click so handlers keep receiving a MouseEvent */
    handleKeyDown = (e: Pick<KeyboardEvent, 'key' | 'preventDefault'> & { currentTarget: { click: () => void } }, isKeyboardLink: boolean) => {
        if (isKeyboardLink && e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.click();
        }
    };
}
