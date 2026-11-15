import type React from 'react';
import { Fragment, useEffect, useMemo } from 'react';
import { get } from 'es-toolkit/compat';
import { type FieldError, isErrorLeaf } from '@fibrae/semi-foundation/components/form/errors';
import type { StandardSchema } from '@fibrae/semi-foundation/components/form/interface';
import { arrayState, blankRow, describeSchemaField, resolveJsonSchema, schemaFieldWarnings, type JsonSchema, type SchemaFieldNode } from '@fibrae/semi-foundation/components/form/json-schema';
import { warning } from '@fibrae/semi-foundation/utils';
import { useDefaultProps } from '../../../base/index';
import ArrayField from '../array-field';
import { useFieldBridgeContext } from '../context';
import useFormState from '../hooks/use-form-state';

export type { JsonSchema, SchemaFieldKind, SchemaFieldNode } from '@fibrae/semi-foundation/components/form/json-schema';

interface SchemaNodeContext {
    node: SchemaFieldNode;
    /** Renders the node at `field` through the same renderers; key the result when rendering a list */
    render: (field: string) => React.ReactNode;
}

export interface SchemaObjectContext extends SchemaNodeContext {
    kind: 'object';
    /** The property nodes rendered in schema order, keyed by property name */
    content: React.ReactNode;
}

export interface SchemaArrayItem {
    /** Stable across moves: key the row with it, not with `index` */
    key: string;
    field: string;
    index: number;
    node: SchemaFieldNode;
    /** The row's current value, such as the field a card title reads */
    value: unknown;
    remove: () => void;
}

export interface SchemaArrayContext extends SchemaNodeContext, ReturnType<typeof arrayState> {
    kind: 'array';
    items: SchemaArrayItem[];
    /** Inserts the schema's blank row before `index`, or appends it; a click event counts as no index */
    add: (index?: number | React.MouseEvent) => void;
    addWithInitValue: (value: Record<string, any>, index?: number) => void;
    move: (from: number, to: number) => void;
    /** The error of the array itself (a schema's minItems), not those of its rows */
    error?: FieldError;
    /** Spread on the element that contains the rows, so scrollToField and focusField reach the array */
    fieldProps: { 'x-field-id': string };
}

/** Any node that is neither an object nor an array: `node.item` is set when it is a row of an array */
export interface SchemaLeafContext extends SchemaNodeContext {
    kind: 'field';
}

export type SchemaFieldContext = SchemaObjectContext | SchemaArrayContext | SchemaLeafContext;

export interface SchemaFieldRenderers {
    /** Without it an object renders its properties with no wrapper */
    object?: (context: SchemaObjectContext) => React.ReactNode;
    array?: (context: SchemaArrayContext) => React.ReactNode;
    /** Also receives the nodes of kind `unsupported` */
    field?: (context: SchemaLeafContext) => React.ReactNode;
}

export interface SchemaFieldProps {
    /** Path of the node to render; '' is the root */
    field?: string;
    /** Wins over the JSON Schema the Form `schema` exports */
    jsonSchema?: JsonSchema;
    /** How each kind of node renders; SchemaField itself renders no UI. `semiRenderers` renders Semi Form controls */
    renderers?: SchemaFieldRenderers;
    /** Replaces the renderer of the node whose `pattern` (array rows as `[]`) is the key */
    renderField?: Record<string, (context: SchemaFieldContext) => React.ReactNode>;
}

interface ArrayNodeProps {
    node: SchemaFieldNode;
    root: JsonSchema;
    render: (field: string) => React.ReactNode;
    renderArray: (context: SchemaArrayContext) => React.ReactNode;
}

function ArrayNode({ node, root, render, renderArray }: ArrayNodeProps) {
    const { values, errors } = useFormState();

    const ownError = get(errors, node.field);

    return (
        <ArrayField field={node.field}>
            {({ arrayFields, add, addWithInitValue, move }) =>
                renderArray({
                    kind: 'array',
                    node,
                    render,
                    ...arrayState(node, arrayFields.length),
                    items: arrayFields.map(({ key, field, remove }, index) => ({ key, field, index, node: describeSchemaField(root, field), value: get(values, field), remove })),
                    add: (index) => {
                        const row = blankRow(root, node.field);
                        const at = typeof index === 'number' ? index : undefined;
                        if (row === undefined) {
                            add(at);
                        } else {
                            addWithInitValue(row as Record<string, any>, at);
                        }
                    },
                    addWithInitValue,
                    move,
                    error: isErrorLeaf(ownError) ? ownError : undefined,
                    fieldProps: { 'x-field-id': node.field },
                })
            }
        </ArrayField>
    );
}

const defaultProps = { field: '' } satisfies Partial<SchemaFieldProps>;

export default function SchemaField(rawProps: SchemaFieldProps) {
    const { field, jsonSchema, renderers, renderField } = useDefaultProps('SchemaField', rawProps, defaultProps);

    const fieldBridge = useFieldBridgeContext();

    if (!fieldBridge) {
        throw new Error('SchemaField must be used inside Form');
    }

    const schema: StandardSchema | undefined = fieldBridge.getFormProps(['schema']).schema;
    const root = useMemo(() => resolveJsonSchema(jsonSchema, schema), [jsonSchema, schema]);
    const node = useMemo(() => root && describeSchemaField(root, field), [root, field]);
    const missing = !root;

    useEffect(() => {
        warning(missing, schemaFieldWarnings.noSchema);
    }, [missing]);

    return node ? renderNode({ root, renderers, renderField }, node) : null;
}

interface RenderScope extends Pick<SchemaFieldProps, 'renderers' | 'renderField'> {
    root: JsonSchema;
}

function renderNode(scope: RenderScope, target: SchemaFieldNode): React.ReactNode {
    const { root, renderers } = scope;
    const custom = scope.renderField?.[target.pattern];
    const render = (field: string) => renderNode(scope, describeSchemaField(root, field));
    if (target.kind === 'object') {
        const context: SchemaObjectContext = { kind: 'object', node: target, render, content: target.children.map((child) => <Fragment key={child.key}>{renderNode(scope, child)}</Fragment>) };
        const renderObject = custom ?? renderers?.object;
        return renderObject ? renderObject(context) : context.content;
    }
    if (target.kind === 'array') {
        const renderArray = custom ?? renderers?.array;
        if (!renderArray) return <MissingRenderer field={target.field} kind="array" />;
        return <ArrayNode node={target} render={render} root={root} renderArray={renderArray} />;
    }
    const renderLeaf = custom ?? renderers?.field;
    if (!renderLeaf) return <MissingRenderer field={target.field} kind="field" />;
    return renderLeaf({ kind: 'field', node: target, render });
}

function MissingRenderer({ field, kind }: { field: string; kind: string }) {
    useEffect(() => {
        warning(true, schemaFieldWarnings.noRenderer(field, kind));
    }, [field, kind]);

    return null;
}
