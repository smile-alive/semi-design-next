<script setup lang="ts">
    import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue';
    import { generateKeys } from '@fibrae/semi-foundation/form/utils';
    import * as ObjectUtil from '@fibrae/semi-foundation/utils/object';
    import { createId } from '@fibrae/semi-foundation/utils/uuid';
    import { semiGlobalDefault } from '../_base/semi-default';
    import { provideArrayFieldContext, useArrayFieldContext } from './context';
    import { requireFormContext } from './hooks';
    import type { ArrayFieldItem, ArrayFieldProps, ArrayFieldSlots } from './interface';
    import { cloneDeep } from './utils';

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<ArrayFieldProps>(), {
        initValue: semiGlobalDefault('ArrayField', 'initValue'),
        keepState: semiGlobalDefault('ArrayField', 'keepState'),
    });

    defineSlots<ArrayFieldSlots>();

    const { bridge, formState, formProps } = requireFormContext('ArrayField');
    const parent = useArrayFieldContext();

    // an existing entry means a remount: by setValues, or after an unmount that kept its state
    const shouldUseInitValue = shallowRef(!bridge.getArrayField(props.field));
    let cachedUpdateKey: number | undefined | null = null;

    const mountedField = props.field;
    const mountedFormState = formState.value;
    const keepState = computed(() => props.keepState ?? parent?.value.keepState ?? formProps.value.keepState ?? true);

    const formValues = () => parent?.value.values ?? formState.value.values ?? {};

    // a remount shows the rows the form holds; the mount write must not replace them with initValue
    const initValue = (shouldUseInitValue.value ? props.initValue : undefined) || ObjectUtil.get(formValues(), props.field);

    const keys = shallowRef(generateKeys(initValue));

    // separate copies: reset, add and remove must not mutate the array the rows read
    const mountedInitValue = cloneDeep(initValue);
    const resetValue = cloneDeep(initValue);

    provideArrayFieldContext(
        computed(() => ({
            shouldUseInitValue: shouldUseInitValue.value,
            keepState: keepState.value,
            values: formState.value === mountedFormState ? ObjectUtil.set(formValues(), props.field, mountedInitValue) : parent?.value.values,
        }))
    );

    // an outside update (formApi.setValue, setValues) renews updateKey
    const syncKeys = () => {
        const updateKey = bridge.getArrayField(props.field)?.updateKey;
        if (updateKey !== cachedUpdateKey) {
            cachedUpdateKey = updateKey;
            keys.value = generateKeys(bridge.getValue(props.field), keys.value);
            shouldUseInitValue.value = false;
        }
    };

    // an event argument, as from `@click="onAdd"`, appends
    const onAdd = (index?: number | Event) => {
        const safeIndex = typeof index === 'number' ? Math.max(0, Math.min(index, keys.value.length)) : undefined;
        keys.value = keys.value.toSpliced(safeIndex ?? keys.value.length, 0, createId());
        shouldUseInitValue.value = true;
        cachedUpdateKey = bridge.addArrayFieldRow(props.field, safeIndex);
    };

    const onAddWithInitValue = (row: unknown, index?: number) => {
        const added = bridge.addArrayFieldRowWithValue(props.field, row, index);
        if (typeof index === 'number') {
            keys.value = keys.value.toSpliced(added.index, 0, createId());
            cachedUpdateKey = added.updateKey;
            shouldUseInitValue.value = false;
        }
    };

    const onMove = (from: number, to: number) => {
        const clamp = (index: number) => Math.max(0, Math.min(index, keys.value.length - 1));
        const source = clamp(from);
        const target = clamp(to);
        if (source === target) return;
        const moved = keys.value.toSpliced(source, 1);
        keys.value = moved.toSpliced(target, 0, keys.value[source]);
        cachedUpdateKey = bridge.moveArrayFieldRow(props.field, source, target);
    };

    const remove = (index: number) => {
        bridge.removeArrayFieldRow(props.field, index);
        keys.value = keys.value.toSpliced(index, 1);
    };

    const arrayFields = computed<ArrayFieldItem[]>(() => keys.value.map((key, i) => ({ key, field: `${props.field}[${i}]`, onRemove: () => remove(i) })));

    watch(
        () => props.field,
        (field, previous) => {
            bridge.unRegisterArrayField(previous, keepState.value);
            if (!bridge.getArrayField(field)) {
                // a changed field resets to its own initial value; its current value may hold rows the rename carried over
                bridge.registerArrayField(field, field === mountedField ? resetValue : cloneDeep(props.initValue || bridge.getInitValue(field)));
            }
            // registering does not update the form state, so the rows follow the new field here
            syncKeys();
        },
        { flush: 'post' }
    );

    watch(formState, syncKeys);

    onMounted(() => bridge.mountArrayField(props.field, resetValue));
    onBeforeUnmount(() => bridge.unRegisterArrayField(props.field, keepState.value));
</script>

<template>
    <slot :arrayFields="arrayFields" :onAdd="onAdd" :onAddWithInitValue="onAddWithInitValue" :onMove="onMove" />
</template>
