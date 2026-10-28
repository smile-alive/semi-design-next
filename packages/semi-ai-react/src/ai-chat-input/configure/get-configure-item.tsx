import { useCallback, useEffect, useEffectEvent, type ComponentType } from 'react';
import clsx from 'clsx';
import { get } from 'es-toolkit/compat';
import { useConfigureContext } from './context';

export interface ConfigureItemOpts<P, VK extends keyof P, CK extends keyof P> {
    /** The prop that receives the value, `value` by default */
    valueKey?: VK;
    /** The prop called when the value changes, `onChange` by default */
    onKeyChangeFnName?: CK;
    /** Where the value sits in the change callback's first argument, the argument itself by default */
    valuePath?: string;
    className?: string;
    defaultProps?: Partial<P>;
}

// the item's own onChange takes that name, so the component's one is not reachable even when it is not the value callback
export type ConfigureItemProps<P, VK extends keyof P, CK extends keyof P> = Omit<P, VK | CK | 'onChange' | 'className'> & {
    /** The key of this item in the Configure value */
    field: string;
    initValue?: P[VK];
    onChange?: (value: unknown) => void;
    className?: string;
};

export default function getConfigureItem<P, VK extends keyof P = 'value' & keyof P, CK extends keyof P = 'onChange' & keyof P>(Component: ComponentType<P>, opts: ConfigureItemOpts<P, VK, CK> = {}) {
    return function ConfigureItem({ field, initValue, onChange: onOriginChange, className, ...rest }: ConfigureItemProps<P, VK, CK>) {
        const { valueKey = 'value', onKeyChangeFnName = 'onChange', valuePath, className: optsCls, defaultProps } = opts;
        const { value = {}, onChange, onRemove } = useConfigureContext('ConfigureItem');

        const onItemChange = useCallback(
            (value: unknown) => {
                const valueResult = valuePath ? get(value, valuePath) : value;
                onChange({ [field]: valueResult });
                onOriginChange?.(valueResult);
            },
            [field, onChange, onOriginChange, valuePath]
        );

        // registers once: initValue only seeds the field at mount, and unmount removes it
        const register = useEffectEvent(() => {
            if (initValue !== undefined) {
                onChange({ [field]: initValue }, true);
            }
            return field;
        });

        const unregister = useEffectEvent((registered: string) => onRemove(registered));

        useEffect(() => {
            const registered = register();
            return () => unregister(registered);
        }, []);

        // the value and change props are injected under keys only known at runtime, which TS cannot check against P
        const componentProps = {
            className: clsx(className, optsCls),
            ...defaultProps,
            ...rest,
            [valueKey]: value[field],
            [onKeyChangeFnName]: onItemChange,
        } as P;

        return <Component {...componentProps} />;
    };
}
