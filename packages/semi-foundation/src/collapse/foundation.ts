import { isEqual } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';

export interface CollapseProps {
    /** '' and null are the controlled "nothing open" values */
    activeKey?: string | string[] | null;
    defaultActiveKey?: string | string[];
    accordion?: boolean;
    clickHeaderToExpand?: boolean;
    onChange?: (activeKey: string[], e: any) => void;
    expandIcon?: any;
    collapseIcon?: any;
    style?: any;
    className?: string;
    keepDOM?: boolean;
    motion?: boolean;
    expandIconPosition?: 'left' | 'right';
}

export interface CollapseState {
    activeSet: Set<string>;
}

/** E is the host's header click or key event, which the foundation only passes through */
export interface CollapseAdapter<E = unknown> extends DefaultAdapter<CollapseProps, CollapseState> {
    notifyChange: (activeKey: string[], e: E) => void;
    setActiveSet: (activeSet: CollapseState['activeSet']) => void;
}

// '' and null mean "nothing open", so they must not become a key
function toSet(activeKey: string | string[] | null) {
    if (Array.isArray(activeKey)) {
        return new Set(activeKey);
    }
    return new Set(activeKey ? [activeKey] : []);
}

export default class CollapseFoundation<E = unknown> extends BaseFoundation<CollapseAdapter<E>, CollapseProps, CollapseState> {
    static getInitialState({ defaultActiveKey, activeKey, accordion }: CollapseProps): CollapseState {
        if (activeKey !== undefined) {
            return { activeSet: toSet(activeKey) };
        }
        const keys = accordion && Array.isArray(defaultActiveKey) ? defaultActiveKey[0] : defaultActiveKey;
        return { activeSet: keys?.length ? toSet(keys) : new Set() };
    }

    static deriveActiveSet(props: CollapseProps, state: CollapseState) {
        return props.activeKey !== undefined ? toSet(props.activeKey) : state.activeSet;
    }

    /**
     * Whether the panel has been open since its body appeared. It resets with the body because Collapsible unmounts
     * with it and loses its own rendered latch, whose lazyRender rule isContentMounted mirrors.
     */
    static isEverOpened({ hasBody, active, everOpened }: { hasBody: boolean; active: boolean; everOpened: boolean }) {
        return hasBody && (everOpened || active);
    }

    /** Whether the body is in the DOM, which aria-controls must not point past */
    static isContentMounted({ hasBody, active, keepDOM, lazyRender, everOpened }: { hasBody: boolean; active: boolean; keepDOM: boolean; lazyRender: boolean; everOpened: boolean }) {
        return hasBody && (active || (keepDOM && (!lazyRender || everOpened)));
    }

    // a later uncontrolled click continues from the last controlled panels
    syncActiveKey(activeKey: CollapseProps['activeKey']) {
        if (activeKey !== undefined) {
            const newSet = toSet(activeKey);
            if (!isEqual(newSet, this.getStates().activeSet)) {
                this._adapter.setActiveSet(newSet);
            }
        }
    }

    handleChange(newKey: string, e: E) {
        const { activeKey, accordion } = this.getProps();
        let newSet = new Set(CollapseFoundation.deriveActiveSet(this.getProps(), this.getStates()));
        if (newSet.has(newKey)) {
            newSet.delete(newKey);
        } else if (accordion) {
            newSet = new Set([newKey]);
        } else {
            newSet.add(newKey);
        }
        this._adapter.notifyChange([...newSet.values()], e);
        if (typeof activeKey === 'undefined') {
            this._adapter.setActiveSet(newSet);
        }
    }
}
