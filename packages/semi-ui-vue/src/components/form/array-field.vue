<script setup lang="ts">
    import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue';
    import ArrayFieldRows from '@fibrae/semi-foundation/components/form/array-field-rows';
    import { resolveKeepState } from '@fibrae/semi-foundation/components/form/utils';
    import { semiGlobalDefault } from '../../base/semi-default';
    import { provideArrayFieldContext, requireFormContext, useArrayFieldContext } from './context';
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

    const keepState = computed(() => resolveKeepState(props.keepState, parent?.value.keepState, formProps.value.keepState));

    const formValues = () => parent?.value.values ?? formState.value.values ?? {};

    const rows = new ArrayFieldRows(
        bridge,
        { field: props.field, initValue: props.initValue, formValues: formValues(), formState: formState.value },
        {
            setKeys: (next) => {
                keys.value = next;
            },
            setShouldUseInitValue: (value) => {
                shouldUseInitValue.value = value;
            },
            cloneDeep,
        }
    );

    const shouldUseInitValue = shallowRef(rows.shouldUseInitValue);
    const keys = shallowRef(rows.keys);

    const arrayFields = computed<ArrayFieldItem[]>(() => keys.value.map((key, i) => ({ key, field: `${props.field}[${i}]`, onRemove: () => rows.remove(i) })));

    // an event argument, as from `@click="onAdd"`, appends
    const { add: onAdd, addWithInitValue: onAddWithInitValue, move: onMove } = rows;

    provideArrayFieldContext(
        computed(() => ({
            shouldUseInitValue: shouldUseInitValue.value,
            keepState: keepState.value,
            values: rows.rowValues(formState.value, formValues(), parent?.value.values),
        }))
    );

    watch(
        () => props.field,
        (field) => rows.rename(field, keepState.value, props.initValue),
        { flush: 'post' }
    );

    watch(formState, rows.sync);

    onMounted(() => rows.mount());
    onBeforeUnmount(() => rows.unmount(keepState.value));
</script>

<template>
    <slot :arrayFields="arrayFields" :onAdd="onAdd" :onAddWithInitValue="onAddWithInitValue" :onMove="onMove" />
</template>
