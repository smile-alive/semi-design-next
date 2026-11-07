<script setup lang="ts">
    import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue';
    import ArrayFieldRows from '@fibrae/semi-foundation/components/form/array-field-rows';
    import { generateKeys, resolveKeepState } from '@fibrae/semi-foundation/components/form/utils';
    import * as ObjectUtil from '@fibrae/semi-foundation/utils/object';
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

    const mountedField = props.field;
    const mountedFormState = formState.value;
    const keepState = computed(() => resolveKeepState(props.keepState, parent?.value.keepState, formProps.value.keepState));

    const formValues = () => parent?.value.values ?? formState.value.values ?? {};

    // a remount shows the rows the form holds; the mount write must not replace them with initValue
    const initValue = (shouldUseInitValue.value ? props.initValue : undefined) || ObjectUtil.get(formValues(), props.field);

    const keys = shallowRef(generateKeys(initValue));

    const rows = new ArrayFieldRows(bridge, keys.value, {
        setKeys: (next) => {
            keys.value = next;
        },
        setShouldUseInitValue: (value) => {
            shouldUseInitValue.value = value;
        },
    });

    // separate copies: reset, add and remove must not mutate the array the rows read
    const mountedInitValue = cloneDeep(initValue);
    const resetValue = cloneDeep(initValue);
    const arrayFields = computed<ArrayFieldItem[]>(() => keys.value.map((key, i) => ({ key, field: `${props.field}[${i}]`, onRemove: () => rows.remove(props.field, i) })));

    provideArrayFieldContext(
        computed(() => ({
            shouldUseInitValue: shouldUseInitValue.value,
            keepState: keepState.value,
            values: formState.value === mountedFormState ? ObjectUtil.set(formValues(), props.field, mountedInitValue) : parent?.value.values,
        }))
    );

    const syncKeys = () => rows.sync(props.field);

    // an event argument, as from `@click="onAdd"`, appends
    const onAdd = (index?: number | Event) => rows.add(props.field, index);

    const onAddWithInitValue = (row: unknown, index?: number) => rows.addWithInitValue(props.field, row, index);

    const onMove = (from: number, to: number) => rows.move(props.field, from, to);

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
