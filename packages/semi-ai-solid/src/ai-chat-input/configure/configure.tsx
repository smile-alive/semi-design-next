import { type JSX, type Ref, createSignal, untrack } from 'solid-js';
import { ConfigureContext } from './context';

export interface ConfigureHandle {
    getConfigureValue: () => Record<string, any>;
}

export interface ConfigureProps {
    /** Read when the component is created */
    value?: Record<string, any>;
    /** Read when the component is created */
    defaultValue?: Record<string, any>;
    onChange?: (value: Record<string, any>, changedValue?: Record<string, any>) => void;
    children?: JSX.Element;
    /** Exposes the current value of every item; delivered once, when the component is created */
    ref?: Ref<ConfigureHandle>;
}

export default function Configure(props: ConfigureProps) {
    // Items register one after another while they are created, each building on the previous, so the merged value is
    // kept in a plain variable the signal mirrors
    let current: Record<string, any> = untrack(() => props.value ?? props.defaultValue ?? {});
    const [value, setValue] = createSignal(current);

    const ref = untrack(() => props.ref);

    const handleChange = (changed: Record<string, any>, init = false) => {
        current = { ...current, ...changed };
        setValue(current);
        if (!init) {
            props.onChange?.(current, changed);
        }
    };

    const handleRemove = (field: string) => {
        const next = { ...current };
        delete next[field];
        current = next;
        setValue(current);
        props.onChange?.(current);
    };

    if (typeof ref === 'function') {
        ref({ getConfigureValue: () => current });
    }

    return <ConfigureContext.Provider value={{ value, onChange: handleChange, onRemove: handleRemove }}>{props.children}</ConfigureContext.Provider>;
}
