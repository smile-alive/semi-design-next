import type { Accessor, JSX } from 'solid-js';
import { createContext } from '../_base/create-context';
import type { BreadcrumbItemInfo, showToolTipProps } from './interface';

/** Live values: every field is a getter, so a reader only re-runs when the field it reads changes */
export interface BreadcrumbView {
    compact: boolean;
    // onClick below always routes through the Breadcrumb; only a handler the user gave makes plain-text items keyboard stops
    hasOnClick: boolean;
    showTooltip?: boolean | showToolTipProps;
}

export interface BreadContextValue {
    /** Returns the same object every time; read its fields inside the expression that needs them */
    view: Accessor<BreadcrumbView>;
    /** Creates the separator anew on every call: one node cannot sit after every item */
    separator: () => JSX.Element;
    onClick: (info: BreadcrumbItemInfo, event: MouseEvent) => void;
}

export const [BreadContext, useBreadContext] = createContext<BreadContextValue>('Breadcrumb');
