import React, { useCallback, useImperativeHandle, useMemo, useState } from 'react';
import { ConfigureContext } from './context';

export interface ConfigureHandle {
    getConfigureValue: () => Record<string, any>;
}

export interface ConfigureProps extends React.PropsWithChildren {
    value?: Record<string, any>;
    defaultValue?: Record<string, any>;
    onChange?: (value: Record<string, any>, changedValue?: Record<string, any>) => void;
    /** Exposes the current value of every item */
    ref?: React.Ref<ConfigureHandle>;
}

// Items register in one effect pass, each building on the previous, so the merged value lives outside state
class ConfigureStore {
    // StrictMode's simulated unmount removes a field that the remount seeds again, which must not reach onChange
    #removed = new Set<string>();
    value: Record<string, any>;

    constructor(value: Record<string, any>) {
        this.value = value;
    }

    merge(changed: Record<string, any>) {
        this.value = { ...this.value, ...changed };
        for (const field of Object.keys(changed)) {
            this.#removed.delete(field);
        }
        return this.value;
    }

    /** Returns false when the field is not in the value */
    remove(field: string) {
        if (!this.value || !(field in this.value)) {
            return false;
        }
        const { [field]: removed, ...rest } = this.value;
        this.value = rest;
        this.#removed.add(field);
        return true;
    }

    /** Returns whether a removal is still standing, and forgets it */
    takeRemoved() {
        const removed = this.#removed.size > 0;
        this.#removed.clear();
        return removed;
    }
}

export default function Configure({ value: valueProp, defaultValue, children, onChange, ref }: ConfigureProps) {
    const [store] = useState(() => new ConfigureStore(valueProp || defaultValue));
    const [value, setValue] = useState(store.value);

    const handleChange = useCallback(
        (changed: Record<string, any>, init = false) => {
            const newValue = store.merge(changed);
            setValue(newValue);
            if (!init) {
                onChange?.(newValue, changed);
            }
        },
        [store, onChange]
    );

    const handleRemove = useCallback(
        (field: string) => {
            if (!store.remove(field)) {
                return;
            }
            setValue(store.value);
            queueMicrotask(() => {
                if (store.takeRemoved()) {
                    onChange?.(store.value);
                }
            });
        },
        [store, onChange]
    );

    const contextValue = useMemo(() => ({ value, onChange: handleChange, onRemove: handleRemove }), [value, handleChange, handleRemove]);

    useImperativeHandle(ref, () => ({ getConfigureValue: () => store.value }), [store]);

    return <ConfigureContext value={contextValue}>{children}</ConfigureContext>;
}
