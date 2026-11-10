<script lang="ts">
    import { onMount, untrack } from 'svelte';
    import ArrayFieldRows from '@fibrae/semi-foundation/components/form/array-field-rows';
    import { resolveKeepState } from '@fibrae/semi-foundation/components/form/utils';
    import useDefaultProps from '../../base/use-default-props.js';
    import watch from '../../hooks/watch.svelte.js';
    import { getArrayFieldContext, getFormContext, setArrayFieldContext } from './context.js';
    import type { ArrayFieldItem, ArrayFieldProps } from './interface.js';
    import { cloneDeep } from './utils.js';

    const defaults = useDefaultProps('ArrayField');
    let { field, initValue = defaults('initValue'), keepState = defaults('keepState'), children }: ArrayFieldProps = $props();

    const form = getFormContext();
    const parent = getArrayFieldContext();

    if (!form) {
        throw new Error('[Semi Form] ArrayField must be called inside <Form>');
    }

    const { bridge } = form;
    const resolvedKeepState = $derived(resolveKeepState(keepState, parent?.keepState, form.formProps.keepState));

    const formValues = () => parent?.values ?? form.formState.values ?? {};

    const rows = new ArrayFieldRows(
        bridge,
        untrack(() => ({ field, initValue, formValues: formValues(), formState: form.formState })),
        {
            setKeys: (next) => (keys = next),
            setShouldUseInitValue: (value) => (shouldUseInitValue = value),
            cloneDeep,
        }
    );

    let shouldUseInitValue = $state(rows.shouldUseInitValue);
    let keys = $state.raw(rows.keys);

    const arrayFields = $derived<ArrayFieldItem[]>(keys.map((key, i) => ({ key, field: `${field}[${i}]`, onRemove: () => rows.remove(i) })));

    // an event argument, as from `onclick={onAdd}`, appends
    const { add: onAdd, addWithInitValue: onAddWithInitValue, move: onMove } = rows;

    setArrayFieldContext({
        get shouldUseInitValue() {
            return shouldUseInitValue;
        },
        get keepState() {
            return resolvedKeepState;
        },
        get values() {
            return rows.rowValues(form.formState, formValues(), parent?.values);
        },
    });

    watch(
        () => form.formState,
        () => rows.sync()
    );

    watch(
        () => field,
        (current) => rows.rename(current, resolvedKeepState, initValue)
    );

    onMount(() => {
        rows.mount();
        return () => rows.unmount(resolvedKeepState);
    });
</script>

{@render children?.({ arrayFields, onAdd, onAddWithInitValue, onMove })}
