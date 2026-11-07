<script lang="ts">
    import { onMount, untrack } from 'svelte';
    import ArrayFieldRows from '@fibrae/semi-foundation/components/form/array-field-rows';
    import { generateKeys, resolveKeepState } from '@fibrae/semi-foundation/components/form/utils';
    import * as ObjectUtil from '@fibrae/semi-foundation/utils/object';
    import useDefaultProps from '../_base/use-default-props.js';
    import watch from '../_base/watch.svelte.js';
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
    const mountedField = untrack(() => field);

    // an existing entry is a remount after keepState or setValues: the rows are the ones in the form values
    let shouldUseInitValue = $state(!bridge.getArrayField(mountedField));
    let registeredField = mountedField;

    const mountedFormState = form.formState;
    const resolvedKeepState = $derived(resolveKeepState(keepState, parent?.keepState, form.formProps.keepState));

    const formValues = () => parent?.values ?? form.formState.values ?? {};

    const mountedValue = untrack(() => (bridge.getArrayField(mountedField) ? ObjectUtil.get(formValues(), mountedField) : initValue || ObjectUtil.get(formValues(), mountedField)));
    const initialKeys = generateKeys(mountedValue);

    let keys = $state.raw(initialKeys);

    const rows = new ArrayFieldRows(bridge, initialKeys, {
        setKeys: (next) => (keys = next),
        setShouldUseInitValue: (value) => (shouldUseInitValue = value),
    });

    // separate copies: reset, add and remove must not mutate the array the rows read
    const mountedInitValue = cloneDeep(mountedValue);
    const resetValue = cloneDeep(mountedValue);
    const arrayFields = $derived<ArrayFieldItem[]>(keys.map((key, i) => ({ key, field: `${field}[${i}]`, onRemove: () => remove(i) })));

    setArrayFieldContext({
        get shouldUseInitValue() {
            return shouldUseInitValue;
        },
        get keepState() {
            return resolvedKeepState;
        },
        // rows read the initial value from here until the mount write renders
        get values() {
            return form.formState === mountedFormState ? ObjectUtil.set(formValues(), mountedField, mountedInitValue) : parent?.values;
        },
    });

    const syncKeys = () => rows.sync(field);

    // an event argument, as from `onclick={onAdd}`, appends
    const onAdd = (index?: number | Event) => rows.add(field, index);

    const onAddWithInitValue = (row: unknown, index?: number) => rows.addWithInitValue(field, row, index);

    const remove = (index: number) => rows.remove(field, index);

    const onMove = (from: number, to: number) => rows.move(field, from, to);

    watch(
        () => form.formState,
        () => syncKeys()
    );

    watch(
        () => field,
        (current) => {
            // a rename leaves the old path as an unmount does
            bridge.unRegisterArrayField(registeredField, resolvedKeepState);
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
        return () => bridge.unRegisterArrayField(registeredField, resolvedKeepState);
    });
</script>

{@render children?.({ arrayFields, onAdd, onAddWithInitValue, onMove })}
