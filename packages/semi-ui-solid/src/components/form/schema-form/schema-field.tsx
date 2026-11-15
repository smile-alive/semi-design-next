import { type Accessor, type JSX, Index, Match, Show, Switch, createEffect, createMemo, mapArray, on } from 'solid-js';
import { get } from 'es-toolkit/compat';
import { type FieldError, isErrorLeaf } from '@fibrae/semi-foundation/components/form/errors';
import { type JsonSchema, type SchemaFieldNode, arrayState, blankRow, describeSchemaField, resolveJsonSchema, schemaFieldWarnings } from '@fibrae/semi-foundation/components/form/json-schema';
import { warning } from '@fibrae/semi-foundation/utils';
import { useDefaultProps } from '../../../base/index';
import ArrayField from '../array-field';
import { useFormContext } from '../context';

export type { JsonSchema, SchemaFieldKind, SchemaFieldNode } from '@fibrae/semi-foundation/components/form/json-schema';

// Renderers run once, so every field of a context is a getter: read it inside JSX or an effect, not once at the top

interface SchemaNodeContext {
    /** Follows the node while a moved row keeps its renderer */
    node: SchemaFieldNode;
    /**
     * Renders the node at `field` through the same renderers. Pass `() => item.field` for an array row, so a move
     * updates the row in place: a plain `item.field` argument is read by the JSX expression, which remounts the row.
     */
    render: (field: string | Accessor<string>) => JSX.Element;
}

export interface SchemaObjectContext extends SchemaNodeContext {
    kind: 'object';
    /** The property nodes rendered in schema order; read it once, each read creates them */
    content: JSX.Element;
}

export interface SchemaArrayItem {
    /** Stable across moves: the identity of the row */
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
    /** One entry per row; an entry keeps its identity while its row exists */
    items: SchemaArrayItem[];
    /** Inserts the schema's blank row before `index`, or appends it; a click event counts as no index */
    add: (index?: number | MouseEvent) => void;
    addWithInitValue: (value: Record<string, any> | string, index?: number) => void;
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
    object?: (context: SchemaObjectContext) => JSX.Element;
    array?: (context: SchemaArrayContext) => JSX.Element;
    /** Also receives the nodes of kind `unsupported` */
    field?: (context: SchemaLeafContext) => JSX.Element;
}

export interface SchemaFieldProps {
    /** Path of the node to render; '' is the root */
    field?: string;
    /** Wins over the JSON Schema the Form `schema` exports */
    jsonSchema?: JsonSchema;
    /** How each kind of node renders; SchemaField itself renders no UI. `semiRenderers` renders Semi Form controls */
    renderers?: SchemaFieldRenderers;
    /** Replaces the renderer of the node whose `pattern` (array rows as `[]`) is the key */
    renderField?: Record<string, (context: SchemaFieldContext) => JSX.Element>;
}

interface NodeProps {
    node: SchemaFieldNode;
    config: SchemaFieldProps;
    root: Accessor<JsonSchema>;
}

const defaultProps = { field: '' } satisfies Partial<SchemaFieldProps>;

function createRender(props: NodeProps): SchemaNodeContext['render'] {
    return (field) => <SchemaNode config={props.config} node={describeSchemaField(props.root(), typeof field === 'function' ? field() : field)} root={props.root} />;
}

function MissingRenderer(props: { field: string; kind: string }) {
    createEffect(() => warning(true, schemaFieldWarnings.noRenderer(props.field, props.kind)));

    return null;
}

function ObjectNode(props: NodeProps) {
    const context: SchemaObjectContext = {
        kind: 'object',
        get node() {
            return props.node;
        },
        render: createRender(props),
        get content() {
            return <Index each={props.node.children}>{(child) => <SchemaNode config={props.config} node={child()} root={props.root} />}</Index>;
        },
    };

    const renderer = () => props.config.renderField?.[props.node.pattern] ?? props.config.renderers?.object;

    return (
        <Show keyed fallback={context.content} when={renderer()}>
            {(render) => render(context)}
        </Show>
    );
}

function ArrayNode(props: NodeProps) {
    // SchemaField threw outside a Form already
    const form = useFormContext()!;

    const renderer = () => props.config.renderField?.[props.node.pattern] ?? props.config.renderers?.array;

    return (
        <Show keyed fallback={<MissingRenderer field={props.node.field} kind="array" />} when={renderer()}>
            {(render) => (
                <ArrayField field={props.node.field}>
                    {(array) => {
                        const state = createMemo(() => arrayState(props.node, array.arrayFields.length));

                        const fieldProps = createMemo(() => ({ 'x-field-id': props.node.field }));

                        // one entry per row, kept while the row exists, so a renderer's For keeps the row's DOM through moves
                        const items = mapArray(
                            () => array.arrayFields,
                            (row, index) => {
                                const node = createMemo(() => describeSchemaField(props.root(), row.field));
                                const value = createMemo(() => get(form.formState().values, row.field));
                                return {
                                    key: row.key,
                                    get field() {
                                        return row.field;
                                    },
                                    get index() {
                                        return index();
                                    },
                                    get node() {
                                        return node();
                                    },
                                    get value() {
                                        return value();
                                    },
                                    remove: row.remove,
                                } satisfies SchemaArrayItem;
                            }
                        );

                        const context: SchemaArrayContext = {
                            kind: 'array',
                            get node() {
                                return props.node;
                            },
                            render: createRender(props),
                            get items() {
                                return items();
                            },
                            get count() {
                                return state().count;
                            },
                            get minItems() {
                                return state().minItems;
                            },
                            get maxItems() {
                                return state().maxItems;
                            },
                            get fixed() {
                                return state().fixed;
                            },
                            get canAdd() {
                                return state().canAdd;
                            },
                            get canRemove() {
                                return state().canRemove;
                            },
                            add: (index) => {
                                const row = blankRow(props.root(), props.node.field);
                                const at = typeof index === 'number' ? index : undefined;
                                if (row === undefined) {
                                    array.add(at);
                                } else {
                                    array.addWithInitValue(row as Record<string, any>, at);
                                }
                            },
                            addWithInitValue: array.addWithInitValue,
                            move: array.move,
                            get error() {
                                const own = get(form.formState().errors, props.node.field);
                                return isErrorLeaf(own) ? own : undefined;
                            },
                            get fieldProps() {
                                return fieldProps();
                            },
                        };

                        return render(context);
                    }}
                </ArrayField>
            )}
        </Show>
    );
}

function LeafNode(props: NodeProps) {
    const context: SchemaLeafContext = {
        kind: 'field',
        get node() {
            return props.node;
        },
        render: createRender(props),
    };

    const renderer = () => props.config.renderField?.[props.node.pattern] ?? props.config.renderers?.field;

    return (
        <Show keyed fallback={<MissingRenderer field={props.node.field} kind="field" />} when={renderer()}>
            {(render) => render(context)}
        </Show>
    );
}

function SchemaNode(props: NodeProps) {
    // one node per change, not a new describeSchemaField result per read of a render() call's props
    const node = createMemo(() => props.node);

    const kind = () => (node().kind === 'object' || node().kind === 'array' ? node().kind : 'field');

    return (
        <Switch>
            <Match when={kind() === 'object'}>
                <ObjectNode config={props.config} node={node()} root={props.root} />
            </Match>
            <Match when={kind() === 'array'}>
                <ArrayNode config={props.config} node={node()} root={props.root} />
            </Match>
            <Match when={kind() === 'field'}>
                <LeafNode config={props.config} node={node()} root={props.root} />
            </Match>
        </Switch>
    );
}

/** Renders the nodes of a JSON Schema inside a Form through `renderers`, from `jsonSchema` or the JSON Schema of the Form's `schema` */
export default function SchemaField(rawProps: SchemaFieldProps) {
    const props = useDefaultProps('SchemaField', rawProps, defaultProps);

    const form = useFormContext();

    if (!form) {
        throw new Error('SchemaField must be used inside Form');
    }

    const root = createMemo(() => resolveJsonSchema(props.jsonSchema, form.formProps.schema));

    const node = createMemo(() => {
        const value = root();
        return value && describeSchemaField(value, props.field);
    });

    createEffect(on(root, (value) => warning(!value, schemaFieldWarnings.noSchema)));

    return <Show when={node()}>{(current) => <SchemaNode config={props} node={current()} root={root as Accessor<JsonSchema>} />}</Show>;
}
