import { type Component, createComponent, mergeProps, onCleanup, onMount, splitProps, untrack } from 'solid-js';
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
    class?: string;
    defaultProps?: Partial<P>;
}

// the item's own onChange takes that name, so the component's one is not reachable even when it is not the value callback
export type ConfigureItemProps<P, VK extends keyof P, CK extends keyof P> = Omit<P, VK | CK | 'onChange' | 'class'> & {
    /** The key of this item in the Configure value */
    field: string;
    /** Seeds the field when the item is created */
    initValue?: P[VK];
    onChange?: (value: unknown) => void;
    class?: string;
};

export default function getConfigureItem<P extends object, VK extends keyof P = 'value' & keyof P, CK extends keyof P = 'onChange' & keyof P>(Item: Component<P>, opts: ConfigureItemOpts<P, VK, CK> = {}) {
    const { valueKey = 'value', onKeyChangeFnName = 'onChange', valuePath, class: optsCls, defaultProps } = opts;

    return function ConfigureItem(props: ConfigureItemProps<P, VK, CK>) {
        const [local, rest] = splitProps(props as ConfigureItemProps<P, VK, CK> & { field: string }, ['field', 'initValue', 'onChange', 'class']);
        const context = useConfigureContext('ConfigureItem');
        // registers once: initValue only seeds the field at creation, and disposal removes the field it registered
        const registered = untrack(() => local.field);

        const onItemChange = (value: unknown) => {
            const valueResult = valuePath ? get(value, valuePath) : value;
            context.onChange({ [local.field]: valueResult });
            local.onChange?.(valueResult);
        };

        onMount(() => {
            const initValue = untrack(() => local.initValue);
            if (initValue !== undefined) {
                context.onChange({ [registered]: initValue }, true);
            }
        });

        onCleanup(() => context.onRemove(registered));

        // the value and change props go under keys only known at runtime, which TS cannot check against P
        const componentProps = mergeProps(
            {
                get class() {
                    return clsx(local.class, optsCls);
                },
            },
            defaultProps,
            rest,
            {
                get [valueKey as string]() {
                    return context.value()[local.field];
                },
                [onKeyChangeFnName as string]: onItemChange,
            }
        ) as P;

        // not `<Item />`: solid-refresh hoists that JSX out of this closure in development and loses the parameter
        return createComponent(Item, componentProps);
    };
}
