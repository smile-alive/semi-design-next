<script setup lang="ts">
    import { computed, Fragment, h, type VNode, type VNodeChild, watch } from 'vue';
    import { get } from 'es-toolkit/compat';
    import { isErrorLeaf } from '@fibrae/semi-foundation/components/form/errors';
    import { arrayState, blankRow, describeSchemaField, resolveJsonSchema, schemaFieldWarnings, type JsonSchema, type SchemaFieldNode } from '@fibrae/semi-foundation/components/form/json-schema';
    import { warning } from '@fibrae/semi-foundation/utils';
    import { semiGlobalDefault } from '../../../base/index';
    import ArrayField from '../array-field.vue';
    import { requireFormContext } from '../context';
    import type { ArrayFieldSlotProps, SchemaArrayContext, SchemaFieldProps, SchemaLeafContext, SchemaObjectContext } from '../interface';
    import MissingRenderer from './missing-renderer';

    const props = withDefaults(defineProps<SchemaFieldProps>(), {
        field: semiGlobalDefault('SchemaField', 'field'),
        jsonSchema: semiGlobalDefault('SchemaField', 'jsonSchema'),
        renderers: semiGlobalDefault('SchemaField', 'renderers'),
        renderField: semiGlobalDefault('SchemaField', 'renderField'),
    });

    const { formProps, formState } = requireFormContext('SchemaField');

    // a computed of its own: formProps is a new object on every Form prop change, the schema is not
    const formSchema = computed(() => formProps.value.schema);
    const root = computed(() => resolveJsonSchema(props.jsonSchema, formSchema.value));
    const node = computed(() => root.value && describeSchemaField(root.value, props.field ?? ''));

    // Built while the ArrayField renders its slot, so values and errors are read there and the rows stay current
    const arrayContext = (jsonRoot: JsonSchema, target: SchemaFieldNode, render: SchemaArrayContext['render'], { arrayFields, onAdd, onAddWithInitValue, onMove }: ArrayFieldSlotProps): SchemaArrayContext => {
        const { values, errors } = formState.value;
        const ownError = get(errors, target.field);
        return {
            kind: 'array',
            node: target,
            render,
            ...arrayState(target, arrayFields.length),
            items: arrayFields.map(({ key, field, onRemove }, index) => ({ key, field, index, node: describeSchemaField(jsonRoot, field), value: get(values, field), remove: onRemove })),
            add: (index) => {
                const row = blankRow(jsonRoot, target.field);
                const at = typeof index === 'number' ? index : undefined;
                if (row === undefined) {
                    onAdd(at);
                } else {
                    onAddWithInitValue(row, at);
                }
            },
            addWithInitValue: onAddWithInitValue,
            move: onMove,
            error: isErrorLeaf(ownError) ? ownError : undefined,
            fieldProps: { 'x-field-id': target.field },
        };
    };

    const renderNode = (jsonRoot: JsonSchema, target: SchemaFieldNode): VNodeChild => {
        const custom = props.renderField?.[target.pattern];
        const render = (field: string): VNode => h(Fragment, null, [renderNode(jsonRoot, describeSchemaField(jsonRoot, field))]);
        if (target.kind === 'object') {
            const context: SchemaObjectContext = {
                kind: 'object',
                node: target,
                render,
                content: h(
                    Fragment,
                    null,
                    (target.children ?? []).map((child) => h(Fragment, { key: child.key }, [renderNode(jsonRoot, child)]))
                ),
            };
            const renderObject = custom ?? props.renderers?.object;
            return renderObject ? renderObject(context) : context.content;
        }
        if (target.kind === 'array') {
            const renderArray = custom ?? props.renderers?.array;
            if (!renderArray) return h(MissingRenderer, { field: target.field, kind: 'array' });
            return h(ArrayField, { field: target.field }, { default: (slot: ArrayFieldSlotProps) => renderArray(arrayContext(jsonRoot, target, render, slot)) });
        }
        const renderLeaf = custom ?? props.renderers?.field;
        if (!renderLeaf) return h(MissingRenderer, { field: target.field, kind: 'field' });
        const context: SchemaLeafContext = { kind: 'field', node: target, render };
        return renderLeaf(context);
    };

    const renderRoot = () => h(Fragment, null, root.value && node.value ? [renderNode(root.value, node.value)] : []);

    watch(
        () => !root.value,
        (missing) => warning(missing, schemaFieldWarnings.noSchema),
        { immediate: true }
    );
</script>

<template>
    <component :is="renderRoot()" />
</template>
