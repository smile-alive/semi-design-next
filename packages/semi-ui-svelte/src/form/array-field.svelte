<script lang="ts">
    import { onMount, untrack } from 'svelte';
    import { generateKeys } from '@fibrae/semi-foundation/form/utils';
    import * as ObjectUtil from '@fibrae/semi-foundation/utils/object';
    import { createId } from '@fibrae/semi-foundation/utils/uuid';
    import useDefaultProps from '../_base/use-default-props.js';
    import watch from '../_base/watch.svelte.js';
    import { getArrayFieldContext, getFormContext, setArrayFieldContext } from './context.js';
    import type { ArrayFieldItem, ArrayFieldProps } from './interface.js';
    import { cloneDeep } from './utils.js';

    const defaults = useDefaultProps('ArrayField');
    let { field, initValue = defaults('initValue'), children }: ArrayFieldProps = $props();

    const form = getFormContext();
    const parent = getArrayFieldContext();

    if (!form) {
        throw new Error('[Semi Form] ArrayField must be called inside <Form>');
    }

    let cachedUpdateKey: number | undefined | null = null;

    const { bridge } = form;
    const mountedField = untrack(() => field);

    // an existing entry means a remount by setValues: its fields must not consume initValue
    let shouldUseInitValue = $state(!bridge.getArrayField(mountedField));
    let registeredField = mountedField;

    const mountedFormState = form.formState;

    const formValues = () => parent?.values ?? form.formState.values ?? {};

    const mountedValue = untrack(() => initValue || ObjectUtil.get(formValues(), mountedField));

    let keys = $state.raw(generateKeys(mountedValue));

    // separate copies: reset, add and remove must not mutate the array the rows read
    const mountedInitValue = cloneDeep(mountedValue);
    const resetValue = cloneDeep(mountedValue);
    const arrayFields = $derived<ArrayFieldItem[]>(keys.map((key, i) => ({ key, field: `${field}[${i}]`, onRemove: () => remove(i) })));

    setArrayFieldContext({
        get shouldUseInitValue() {
            return shouldUseInitValue;
        },
        // rows read the initial value from here until the mount write renders
        get values() {
            return form.formState === mountedFormState ? ObjectUtil.set(formValues(), mountedField, mountedInitValue) : parent?.values;
        },
    });

    // an outside update (formApi.setValue, setValues) renews updateKey
    const syncKeys = () => {
        const updateKey = bridge.getArrayField(field)?.updateKey;
        if (updateKey !== cachedUpdateKey) {
            cachedUpdateKey = updateKey;
            keys = generateKeys(bridge.getValue(field), keys);
            shouldUseInitValue = false;
        }
    };

    // an event argument, as from `onclick={onAdd}`, appends
    const onAdd = (index?: number | Event) => {
        const safeIndex = typeof index === 'number' ? Math.max(0, Math.min(index, keys.length)) : undefined;
        keys = keys.toSpliced(safeIndex ?? keys.length, 0, createId());
        shouldUseInitValue = true;
        cachedUpdateKey = bridge.addArrayFieldRow(field, safeIndex);
    };

    const onAddWithInitValue = (row: unknown, index?: number) => {
        const added = bridge.addArrayFieldRowWithValue(field, row, index);
        if (typeof index === 'number') {
            // a new key at the position: regenerating by position would keep the old keys, so fields keep stale values
            keys = keys.toSpliced(added.index, 0, createId());
            cachedUpdateKey = added.updateKey;
            // the new row's fields take the given row value, as after syncKeys
            shouldUseInitValue = false;
        }
    };

    const remove = (index: number) => {
        bridge.removeArrayFieldRow(field, index);
        keys = keys.toSpliced(index, 1);
    };

    watch(
        () => form.formState,
        () => syncKeys()
    );

    watch(
        () => field,
        (current) => {
            bridge.unRegisterArrayField(registeredField);
            registeredField = current;
            if (!bridge.getArrayField(current)) {
                // a changed field resets to its own initial value; its current value may hold rows the rename carried over
                bridge.registerArrayField(current, current === mountedField ? resetValue : cloneDeep(initValue || bridge.getInitValue(current)));
            }
            // registering does not update the form state, so the rows follow the new field here
            syncKeys();
        }
    );

    onMount(() => {
        bridge.mountArrayField(mountedField, resetValue);
        return () => bridge.unRegisterArrayField(registeredField);
    });
</script>

{@render children?.({ arrayFields, onAdd, onAddWithInitValue })}
