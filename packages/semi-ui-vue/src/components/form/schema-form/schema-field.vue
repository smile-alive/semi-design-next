<script setup lang="ts">
    import { type Component, computed, h, watch } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
    import { blankRow, describeSchemaField, resolveJsonSchema, type SchemaFieldKind, type SchemaFieldNode } from '@fibrae/semi-foundation/components/form/json-schema';
    import { formatLocale } from '@fibrae/semi-foundation/locale/format';
    import warning from '@fibrae/semi-foundation/utils/warning';
    import { IconArrowDown, IconArrowUp, IconDelete, IconPlus } from '@fibrae/semi-icons-vue';
    import { semiGlobalDefault } from '../../../base/semi-default';
    import SlotFragment from '../../../base/slot-fragment';
    import Button from '../../button';
    import useLocale from '../../locale/use-locale';
    import ArrayField from '../array-field.vue';
    import { requireFormContext } from '../context';
    import { FormInput, FormInputNumber, FormSelect, FormSwitch, FormTextArea } from '../field';
    import type { SchemaFieldProps } from '../interface';
    import FormSection from '../section.vue';

    // the object and array kinds render SchemaField again for their properties and rows
    defineOptions({ name: 'SchemaField' });

    const props = withDefaults(defineProps<SchemaFieldProps>(), {
        field: semiGlobalDefault('SchemaField', 'field'),
        jsonSchema: semiGlobalDefault('SchemaField', 'jsonSchema'),
        widgets: semiGlobalDefault('SchemaField', 'widgets'),
        renderField: semiGlobalDefault('SchemaField', 'renderField'),
    });

    const { formProps } = requireFormContext('SchemaField');
    const locale = useLocale('Form');

    const rowClass = `${cssClasses.PREFIX}-schema-array-row`;

    const builtins: Partial<Record<SchemaFieldKind, Component>> = {
        input: FormInput,
        textarea: FormTextArea,
        number: FormInputNumber,
        switch: FormSwitch,
        select: FormSelect,
    };

    // a computed of its own: formProps is a new object on every Form prop change, the schema is not
    const formSchema = computed(() => formProps.value.schema);
    const root = computed(() => resolveJsonSchema(props.jsonSchema, formSchema.value));
    const node = computed(() => root.value && describeSchemaField(root.value, props.field ?? ''));

    const widget = (target: SchemaFieldNode) => (target.format && props.widgets?.[target.format]) || props.widgets?.[target.kind] || builtins[target.kind];

    const indexText = (template: string, index: number) => formatLocale(template, { index: index + 1 });

    const labelText = (target: SchemaFieldNode) => target.title ?? indexText(locale.value.locale.item, Number(target.key));

    const renderer = (target: SchemaFieldNode) => props.renderField?.[target.pattern];

    const customNode = (target: SchemaFieldNode) => h(SlotFragment, null, () => renderer(target)?.({ node: target, field: target.field }));

    const controlProps = (target: SchemaFieldNode): Record<string, unknown> => {
        const common = { field: target.field, label: { text: labelText(target), required: target.required }, initValue: target.default };
        switch (target.kind) {
            case 'input':
                return { ...common, maxlength: target.maxLength };
            case 'textarea':
                return { ...common, maxCount: target.maxLength };
            case 'number':
                return { ...common, min: target.minimum, max: target.maximum, precision: target.integer ? 0 : undefined };
            case 'select':
                return { ...common, optionList: target.options, multiple: target.multiple };
            default:
                return common;
        }
    };

    const addDisabled = (target: SchemaFieldNode, length: number) => target.maxItems != null && length >= target.maxItems;

    const removeDisabled = (target: SchemaFieldNode, length: number) => length <= (target.minItems ?? 0);

    const addRow = (target: SchemaFieldNode, add: (row: unknown) => void) => {
        if (root.value) add(blankRow(root.value, target));
    };

    watch(
        () => !root.value,
        (missing) => warning(missing, '[Semi SchemaField] there is no JSON Schema to render: pass jsonSchema, or give the Form a schema that exports Standard JSON Schema'),
        { immediate: true }
    );

    watch(
        () => {
            const target = node.value;
            return target?.kind === 'unsupported' && !renderer(target) && !widget(target) ? target.field : undefined;
        },
        (path) => warning(path != null, `[Semi SchemaField] the schema of field "${path}" has no built-in control and is not rendered; give it a widget or a renderField`),
        { immediate: true }
    );
</script>

<template>
    <template v-if="node">
        <component :is="customNode(node)" v-if="renderer(node)" :key="`render:${node.field}`" />
        <component :is="node.field === '' ? SlotFragment : FormSection" v-else-if="node.kind === 'object'" :key="`object:${node.field}`">
            <template #text>
                {{ labelText(node) }}
            </template>
            <SchemaField v-for="child in node.children" :key="child.field" :field="child.field" :jsonSchema="root" :renderField="props.renderField" :widgets="props.widgets" />
        </component>
        <component :is="node.field === '' ? SlotFragment : FormSection" v-else-if="node.kind === 'array'" :key="`array:${node.field}`">
            <template #text>
                {{ labelText(node) }}
            </template>
            <ArrayField :field="node.field">
                <template #default="{ arrayFields, onAddWithInitValue, onMove }">
                    <div v-for="(row, index) in arrayFields" :key="row.key" :class="rowClass">
                        <div :class="`${rowClass}-content`">
                            <SchemaField :field="row.field" :jsonSchema="root" :renderField="props.renderField" :widgets="props.widgets" />
                        </div>
                        <div :class="`${rowClass}-actions`">
                            <Button :aria-label="indexText(locale.locale.moveUpItem, index)" :disabled="index === 0" theme="borderless" type="tertiary" @click="onMove(index, index - 1)">
                                <template #icon>
                                    <IconArrowUp />
                                </template>
                            </Button>
                            <Button :aria-label="indexText(locale.locale.moveDownItem, index)" :disabled="index === arrayFields.length - 1" theme="borderless" type="tertiary" @click="onMove(index, index + 1)">
                                <template #icon>
                                    <IconArrowDown />
                                </template>
                            </Button>
                            <Button v-if="!node.fixed" :aria-label="indexText(locale.locale.removeItem, index)" :disabled="removeDisabled(node, arrayFields.length)" theme="borderless" type="tertiary" @click="row.onRemove()">
                                <template #icon>
                                    <IconDelete />
                                </template>
                            </Button>
                        </div>
                    </div>
                    <Button v-if="!node.fixed" :disabled="addDisabled(node, arrayFields.length)" @click="addRow(node, onAddWithInitValue)">
                        <template #icon>
                            <IconPlus />
                        </template>
                        {{ locale.locale.addItem }}
                    </Button>
                </template>
            </ArrayField>
        </component>
        <component :is="widget(node)" v-else-if="widget(node)" :key="`widget:${node.field}`" v-bind="controlProps(node)">
            <template v-if="node.description" #extraText>
                {{ node.description }}
            </template>
        </component>
    </template>
</template>
