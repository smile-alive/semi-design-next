import type React from 'react';
import { Fragment, useEffect, useMemo } from 'react';
import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
import type { StandardSchema } from '@fibrae/semi-foundation/components/form/interface';
import { blankRow, describeSchemaField, resolveJsonSchema, type JsonSchema, type SchemaFieldKind, type SchemaFieldNode } from '@fibrae/semi-foundation/components/form/json-schema';
import { formatLocale } from '@fibrae/semi-foundation/locale/format';
import warning from '@fibrae/semi-foundation/utils/warning';
import { IconArrowDown, IconArrowUp, IconDelete, IconPlus } from '@fibrae/semi-icons-react';
import useDefaultProps from '../../base/use-default-props';
import Button from '../button';
import useLocale from '../locale/use-locale';
import ArrayField from './array-field';
import { useFieldBridgeContext } from './context';
import { FormInput, FormInputNumber, FormSelect, FormSwitch, FormTextArea } from './field';
import Section from './section';

export type { JsonSchema, SchemaFieldKind, SchemaFieldNode } from '@fibrae/semi-foundation/components/form/json-schema';

export type SchemaFieldRenderer = (context: { node: SchemaFieldNode; field: string }) => React.ReactNode;

export interface SchemaFieldProps {
    /** Path of the node to render; '' is the root, whose properties render without a Section */
    field?: string;
    /** Wins over the JSON Schema the Form `schema` exports */
    jsonSchema?: JsonSchema;
    /** Field components by `format` or by kind, given the props of the built-in control; `widgets[format]` wins over `widgets[kind]` */
    widgets?: Record<string, React.ComponentType<any>>;
    /** Renders the node whose `pattern` (array items as `[]`) is the key, its subtree included */
    renderField?: Record<string, SchemaFieldRenderer>;
}

const rowClass = `${cssClasses.PREFIX}-schema-array-row`;

const builtinWidgets: Partial<Record<SchemaFieldKind, React.ComponentType<any>>> = {
    input: FormInput,
    textarea: FormTextArea,
    number: FormInputNumber,
    switch: FormSwitch,
    select: FormSelect,
};

function controlProps(node: SchemaFieldNode) {
    switch (node.kind) {
        case 'input':
            return { maxLength: node.maxLength };
        case 'textarea':
            return { maxCount: node.maxLength };
        case 'number':
            return { max: node.maximum, min: node.minimum, precision: node.integer ? 0 : undefined };
        case 'select':
            return { multiple: node.multiple, optionList: node.options };
        default:
            return {};
    }
}

function UnsupportedField({ field }: { field: string }) {
    useEffect(() => {
        warning(true, `[Semi Form] SchemaField renders nothing for "${field}": its schema maps to no control`);
    }, [field]);

    return null;
}

const defaultProps = { field: '' } satisfies Partial<SchemaFieldProps>;

export default function SchemaField(rawProps: SchemaFieldProps) {
    const { field, jsonSchema, widgets, renderField } = useDefaultProps('SchemaField', rawProps, defaultProps);

    const fieldBridge = useFieldBridgeContext();
    const { locale } = useLocale('Form');

    if (!fieldBridge) {
        throw new Error('SchemaField must be used inside Form');
    }

    const schema: StandardSchema | undefined = fieldBridge.getFormProps(['schema']).schema;
    const root = useMemo(() => resolveJsonSchema(jsonSchema, schema), [jsonSchema, schema]);
    const node = useMemo(() => root && describeSchemaField(root, field), [root, field]);
    const missing = !root;

    const withIndex = (text: string, index: number) => formatLocale(text, { index: index + 1 });

    const titleOf = (target: SchemaFieldNode) => target.title ?? withIndex(locale.item, Number(target.key));

    const renderArray = (arrayNode: SchemaFieldNode) => (
        <ArrayField field={arrayNode.field}>
            {({ arrayFields, add, addWithInitValue, move }) => {
                const count = arrayFields.length;
                const canAdd = arrayNode.maxItems === undefined || count < arrayNode.maxItems;
                const canRemove = count > (arrayNode.minItems ?? 0);
                const handleAdd = () => {
                    const row = blankRow(root, arrayNode);
                    if (row === undefined) {
                        add();
                    } else {
                        addWithInitValue(row as Record<string, any>);
                    }
                };
                return (
                    <>
                        {arrayFields.map(({ key, field: rowField, remove }, index) => (
                            <div key={key} className={rowClass}>
                                <div className={`${rowClass}-content`}>{renderNode(describeSchemaField(root, rowField))}</div>
                                <div className={`${rowClass}-actions`}>
                                    <Button type="tertiary" aria-label={withIndex(locale.moveUpItem, index)} disabled={index === 0} theme="borderless" icon={<IconArrowUp />} onClick={() => move(index, index - 1)} />
                                    <Button type="tertiary" aria-label={withIndex(locale.moveDownItem, index)} disabled={index === count - 1} theme="borderless" icon={<IconArrowDown />} onClick={() => move(index, index + 1)} />
                                    {!arrayNode.fixed && <Button type="tertiary" aria-label={withIndex(locale.removeItem, index)} disabled={!canRemove} theme="borderless" icon={<IconDelete />} onClick={remove} />}
                                </div>
                            </div>
                        ))}
                        {!arrayNode.fixed && (
                            <Button disabled={!canAdd} icon={<IconPlus />} onClick={handleAdd}>
                                {locale.addItem}
                            </Button>
                        )}
                    </>
                );
            }}
        </ArrayField>
    );

    // Children are keyed by property name, not by path: a moved row keeps its fields mounted
    const renderNode = (target: SchemaFieldNode): React.ReactNode => {
        const custom = renderField?.[target.pattern];
        if (custom) {
            return custom({ node: target, field: target.field });
        }
        const Widget = (target.format !== undefined ? widgets?.[target.format] : undefined) ?? widgets?.[target.kind] ?? builtinWidgets[target.kind];
        if (Widget) {
            return <Widget extraText={target.description} field={target.field} initValue={target.default} label={{ text: titleOf(target), required: target.required }} {...controlProps(target)} />;
        }
        if (target.kind === 'object' || target.kind === 'array') {
            const content = target.kind === 'array' ? renderArray(target) : target.children.map((child) => <Fragment key={child.key}>{renderNode(child)}</Fragment>);
            return target.field === '' ? content : <Section text={titleOf(target)}>{content}</Section>;
        }
        return <UnsupportedField field={target.field} />;
    };

    useEffect(() => {
        warning(missing, '[Semi Form] SchemaField has no JSON Schema: pass jsonSchema, or give the Form a schema that exports one');
    }, [missing]);

    return node ? renderNode(node) : null;
}
