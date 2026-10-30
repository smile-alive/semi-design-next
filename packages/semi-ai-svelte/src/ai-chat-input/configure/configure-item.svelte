<script lang="ts">
    import { type Component, onMount, untrack } from 'svelte';
    import type { ClassValue } from 'svelte/elements';
    import { get } from 'es-toolkit/compat';
    import { getConfigureContext } from './context.js';

    interface ConfigureItemProps {
        /** The component the item wraps: it receives the field's value and reports changes */
        component: Component<any>;
        /** The key of this item in the Configure value */
        field: string;
        /** Seeds the field when the item is mounted */
        initValue?: unknown;
        /** The prop that receives the value, `value` by default */
        valueKey?: string;
        /** The prop that takes the change callback, `onChange` by default */
        changeKey?: string;
        /** Where the value sits in the change callback's first argument, the argument itself by default */
        valuePath?: string;
        baseClass?: ClassValue;
        defaultProps?: Record<string, unknown>;
        class?: ClassValue | null;
        // any: each wrapper types the value of its own component, which unknown would reject by parameter variance
        onChange?: (value: any) => void;
        [key: string]: unknown;
    }

    let { component: Wrapped, field, initValue, valueKey = 'value', changeKey = 'onChange', valuePath, baseClass, defaultProps, class: className, onChange, ...rest }: ConfigureItemProps = $props();

    const context = getConfigureContext('ConfigureItem');

    // registers once: initValue only seeds the field at mount, and unmount removes the field it registered
    const registered = untrack(() => field);

    const handleChange = (next: unknown) => {
        const value = valuePath ? get(next, valuePath) : next;
        context?.onChange({ [field]: value });
        onChange?.(value);
    };

    const bindings = $derived({
        ...defaultProps,
        ...rest,
        class: [baseClass, className],
        [valueKey]: context?.view[field],
        [changeKey]: handleChange,
    });

    onMount(() => {
        if (initValue !== undefined) {
            context?.onChange({ [registered]: initValue }, true);
        }
        return () => context?.onRemove(registered);
    });
</script>

<Wrapped {...bindings} />
