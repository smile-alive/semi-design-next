import React, { useCallback, useImperativeHandle, useMemo, useState } from 'react';
import ConfigureButton from './button';
import { ConfigureContext } from './context';
import ConfigureMcp from './mcp';
import ConfigureRadioButton from './radio-button';
import ConfigureSelect from './select';

export interface ConfigureHandle {
    getConfigureValue: () => Record<string, any>;
}

export interface ConfigureProps {
    value?: Record<string, any>;
    defaultValue?: Record<string, any>;
    onChange?: (value: Record<string, any>, changedValue?: Record<string, any>) => void;
    children?: React.ReactNode;
    /** Exposes the current value of every item */
    ref?: React.Ref<ConfigureHandle>;
}

// Items register in one effect pass, each building on the previous, so the merged value lives outside state
class ConfigureStore {
    value: Record<string, any>;

    constructor(value: Record<string, any>) {
        this.value = value;
    }

    merge(changed: Record<string, any>) {
        this.value = { ...this.value, ...changed };
        return this.value;
    }

    remove(field: string) {
        const { [field]: removed, ...rest } = this.value ?? {};
        this.value = rest;
        return this.value;
    }
}

function Configure(props: ConfigureProps) {
    const { children, onChange, ref } = props;

    const [store] = useState(() => new ConfigureStore(props.value || props.defaultValue));
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
            const newValue = store.remove(field);
            setValue(newValue);
            onChange?.(newValue);
        },
        [store, onChange]
    );

    const contextValue = useMemo(() => ({ value, onChange: handleChange, onRemove: handleRemove }), [value, handleChange, handleRemove]);

    useImperativeHandle(ref, () => ({ getConfigureValue: () => store.value }), [store]);

    return <ConfigureContext value={contextValue}>{children}</ConfigureContext>;
}

export default Object.assign(Configure, {
    Button: ConfigureButton,
    Select: ConfigureSelect,
    Mcp: ConfigureMcp,
    RadioButton: ConfigureRadioButton,
});
