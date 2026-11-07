import { type Accessor, type Component, type JSX, For, Index, Match, Show, Switch, createEffect, createMemo, on, untrack } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
import { type JsonSchema, type SchemaFieldKind, type SchemaFieldNode, blankRow, describeSchemaField, resolveJsonSchema } from '@fibrae/semi-foundation/components/form/json-schema';
import { formatLocale } from '@fibrae/semi-foundation/locale/format';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import warning from '@fibrae/semi-foundation/utils/warning';
import { IconArrowDown, IconArrowUp, IconDelete, IconPlus } from '@fibrae/semi-icons-solid';
import useDefaultProps from '../../base/use-default-props';
import Button from '../button';
import IconButton from '../icon-button';
import useLocale from '../locale/use-locale';
import ArrayField from './array-field';
import { useFormContext } from './context';
import { FormInput, FormInputNumber, FormSelect, FormSwitch, FormTextArea } from './field';
import Section from './section';

export type { JsonSchema, SchemaFieldKind, SchemaFieldNode } from '@fibrae/semi-foundation/components/form/json-schema';

export interface SchemaFieldRenderContext {
    node: SchemaFieldNode;
    field: string;
}

export interface SchemaFieldProps {
    /** Path of the node to render; the root by default, whose object renders without a Section */
    field?: string;
    /** Wins over the JSON Schema exported from the Form's `schema` */
    jsonSchema?: JsonSchema;
    /** Field components by `format`, then by kind, used in place of the built-in control with the same props */
    widgets?: Record<string, Component<any>>;
    /** Renderers by node pattern (`contacts[].email`); a match renders the node and its subtree */
    renderField?: Record<string, (context: SchemaFieldRenderContext) => JSX.Element>;
}

interface NodeProps {
    node: SchemaFieldNode;
    root: JsonSchema;
    config: SchemaFieldProps;
    messages: Accessor<Locale['Form']>;
}

const defaultProps = {} satisfies Partial<SchemaFieldProps>;

const builtins: Partial<Record<SchemaFieldKind, Component<any>>> = {
    input: FormInput,
    textarea: FormTextArea,
    number: FormInputNumber,
    switch: FormSwitch,
    select: FormSelect,
};

const rowClass = `${cssClasses.PREFIX}-schema-array-row`;

const withIndex = (template: string, index: number) => formatLocale(template, { index: index + 1 });

function controlProps(node: SchemaFieldNode) {
    switch (node.kind) {
        case 'input':
            return { maxLength: node.maxLength };
        case 'textarea':
            return { maxCount: node.maxLength };
        case 'number':
            return { min: node.minimum, max: node.maximum, precision: node.integer ? 0 : undefined };
        case 'select':
            return { optionList: node.options, multiple: node.multiple };
        default:
            return {};
    }
}

function UnsupportedNode(props: { field: string }) {
    untrack(() => warning(true, `[Semi Form] SchemaField cannot render the schema of "${props.field}"; render it with renderField or a widget`));

    return null;
}

function SchemaArray(props: NodeProps & { title?: string }) {
    return (
        <Section text={props.title}>
            <ArrayField field={props.node.field}>
                {(array) => {
                    const count = () => array.arrayFields.length;
                    const canAdd = () => props.node.maxItems == null || count() < props.node.maxItems;
                    const canRemove = () => props.node.minItems == null || count() > props.node.minItems;

                    const add = () => {
                        const row = blankRow(props.root, props.node);
                        if (row === undefined) {
                            array.add();
                        } else {
                            array.addWithInitValue(row as Record<string, any>);
                        }
                    };

                    return (
                        <>
                            <For each={array.arrayFields}>
                                {(row, index) => {
                                    const rowNode = createMemo(() => describeSchemaField(props.root, row.field));
                                    return (
                                        <div class={rowClass}>
                                            <div class={`${rowClass}-content`}>
                                                <SchemaNode config={props.config} messages={props.messages} node={rowNode()} root={props.root} />
                                            </div>
                                            <div class={`${rowClass}-actions`}>
                                                <IconButton aria-label={withIndex(props.messages().moveUpItem, index())} disabled={index() === 0} icon={<IconArrowUp />} theme="borderless" type="tertiary" onClick={() => array.move(index(), index() - 1)} />
                                                <IconButton aria-label={withIndex(props.messages().moveDownItem, index())} disabled={index() === count() - 1} icon={<IconArrowDown />} theme="borderless" type="tertiary" onClick={() => array.move(index(), index() + 1)} />
                                                <Show when={!props.node.fixed}>
                                                    <IconButton aria-label={withIndex(props.messages().removeItem, index())} disabled={!canRemove()} icon={<IconDelete />} theme="borderless" type="tertiary" onClick={row.remove} />
                                                </Show>
                                            </div>
                                        </div>
                                    );
                                }}
                            </For>
                            <Show when={!props.node.fixed}>
                                <Button disabled={!canAdd()} icon={<IconPlus />} theme="light" onClick={add}>
                                    {props.messages().addItem}
                                </Button>
                            </Show>
                        </>
                    );
                }}
            </ArrayField>
        </Section>
    );
}

function SchemaNode(props: NodeProps) {
    // live: a moved row renames the node while the renderer stays
    const context: SchemaFieldRenderContext = {
        get node() {
            return props.node;
        },
        get field() {
            return props.node.field;
        },
    };

    const renderer = () => props.config.renderField?.[props.node.pattern];

    const control = () => (props.node.format == null ? undefined : props.config.widgets?.[props.node.format]) ?? props.config.widgets?.[props.node.kind] ?? builtins[props.node.kind];

    const title = () => props.node.title ?? (typeof props.node.key === 'number' ? withIndex(props.messages().item, props.node.key) : undefined);

    // one object while the node stays: the field reads its label and options without new copies on every read
    const fieldProps = createMemo(() => ({
        field: props.node.field,
        label: { text: title(), required: props.node.required },
        extraText: props.node.description,
        initValue: props.node.default,
        ...controlProps(props.node),
    }));

    const objectChildren = () => <Index each={props.node.children}>{(child) => <SchemaNode config={props.config} messages={props.messages} node={child()} root={props.root} />}</Index>;

    return (
        <Show
            keyed
            fallback={
                <Switch>
                    <Match when={control()}>{(component) => <Dynamic component={component()} {...fieldProps()} />}</Match>
                    <Match when={props.node.kind === 'object'}>
                        <Show when={props.node.field !== ''} fallback={objectChildren()}>
                            <Section text={title()}>{objectChildren()}</Section>
                        </Show>
                    </Match>
                    <Match when={props.node.kind === 'array'}>
                        <SchemaArray config={props.config} messages={props.messages} node={props.node} root={props.root} title={title()} />
                    </Match>
                    <Match when={props.node.kind === 'unsupported'}>
                        <UnsupportedNode field={props.node.field} />
                    </Match>
                </Switch>
            }
            when={renderer()}
        >
            {(render) => render(context)}
        </Show>
    );
}

/** Renders the fields of a JSON Schema node inside a Form, from `jsonSchema` or the JSON Schema of the Form's `schema` */
export default function SchemaField(rawProps: SchemaFieldProps) {
    const props = useDefaultProps('SchemaField', rawProps, defaultProps);

    const form = useFormContext();
    const locale = useLocale('Form');

    if (!form) {
        throw new Error('SchemaField must be used inside Form');
    }

    const root = createMemo(() => resolveJsonSchema(props.jsonSchema, form.formProps.schema));

    const node = createMemo(() => {
        const value = root();
        return value && describeSchemaField(value, props.field);
    });

    const messages = () => locale().locale;

    createEffect(on(root, (value) => warning(!value, '[Semi Form] SchemaField has no JSON Schema: pass jsonSchema, or give the Form a schema that implements Standard JSON Schema')));

    return <Show when={node()}>{(current) => <SchemaNode config={props} messages={messages} node={current()} root={root() as JsonSchema} />}</Show>;
}
