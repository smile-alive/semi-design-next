import { type Component, type JSX, For, Show, createEffect, createMemo } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
import { type SchemaFieldKind, type SchemaFieldNode, controlProps, schemaFieldWarnings, singleItemName } from '@fibrae/semi-foundation/components/form/json-schema';
import { formatLocale } from '@fibrae/semi-foundation/locale';
import { warning } from '@fibrae/semi-foundation/utils';
import { IconArrowDown, IconArrowUp, IconDelete, IconPlus } from '@fibrae/semi-icons-solid';
import Button from '../../button';
import IconButton from '../../icon-button';
import useLocale from '../../locale/use-locale';
import { FormInput, FormInputNumber, FormSelect, FormSwitch, FormTextArea } from '../field';
import Section from '../section';
import type { SchemaArrayContext, SchemaFieldRenderers, SchemaLeafContext, SchemaObjectContext } from './schema-field';

const rowClass = `${cssClasses.PREFIX}-schema-array-row`;

const controls: Partial<Record<SchemaFieldKind, Component<any>>> = {
    input: FormInput,
    textarea: FormTextArea,
    number: FormInputNumber,
    switch: FormSwitch,
    select: FormSelect,
};

const withIndex = (text: string, index: number) => formatLocale(text, { index: index + 1 });

// The root renders no Section: the Form already is its group
function NodeSection(props: { node: SchemaFieldNode; children: JSX.Element; fieldProps?: { 'x-field-id': string } }) {
    const locale = useLocale('Form');

    return (
        <Show fallback={props.children} when={props.node.field !== ''}>
            <Section {...props.fieldProps} extraText={props.node.description} text={props.node.title ?? withIndex(locale().locale.item, props.node.item?.index ?? 0)}>
                {props.children}
            </Section>
        </Show>
    );
}

const renderObject = (context: SchemaObjectContext) => <NodeSection node={context.node}>{context.content}</NodeSection>;

const renderArray = (context: SchemaArrayContext) => {
    const locale = useLocale('Form');

    const text = () => locale().locale;

    return (
        <NodeSection fieldProps={context.fieldProps} node={context.node}>
            <For each={context.items}>
                {(item) => (
                    <div class={clsx(rowClass, singleItemName(item.node, text()) !== undefined && `${rowClass}-single`)}>
                        <div class={`${rowClass}-content`}>{context.render(() => item.field)}</div>
                        <div class={`${rowClass}-actions`}>
                            <IconButton aria-label={withIndex(text().moveUpItem, item.index)} disabled={item.index === 0} icon={<IconArrowUp />} theme="borderless" type="tertiary" onClick={() => context.move(item.index, item.index - 1)} />
                            <IconButton aria-label={withIndex(text().moveDownItem, item.index)} disabled={item.index === context.count - 1} icon={<IconArrowDown />} theme="borderless" type="tertiary" onClick={() => context.move(item.index, item.index + 1)} />
                            <Show when={!context.fixed}>
                                <IconButton aria-label={withIndex(text().removeItem, item.index)} disabled={!context.canRemove} icon={<IconDelete />} theme="borderless" type="tertiary" onClick={item.remove} />
                            </Show>
                        </div>
                    </div>
                )}
            </For>
            <Show when={!context.fixed}>
                <Button disabled={!context.canAdd} icon={<IconPlus />} theme="light" onClick={context.add}>
                    {text().addItem}
                </Button>
            </Show>
        </NodeSection>
    );
};

const renderField = (context: SchemaLeafContext) => {
    const locale = useLocale('Form');

    const control = () => controls[context.node.kind];

    // one object while the node stays: the field reads its label and options without new copies on every read
    const fieldProps = createMemo(() => {
        const { node } = context;
        const itemName = singleItemName(node, locale().locale);
        return {
            field: node.field,
            initValue: node.default,
            ...(itemName === undefined ? { extraText: node.description, label: { text: node.title ?? withIndex(locale().locale.item, node.item?.index ?? 0), required: node.required } } : { noLabel: true, 'aria-label': itemName }),
            ...controlProps(node),
        };
    });

    createEffect(() => warning(!control(), schemaFieldWarnings.unsupported(context.node.field)));

    return <Dynamic component={control()} {...fieldProps()} />;
};

/**
 * Renders SchemaField with Semi Form controls: objects and arrays as Sections, array rows with move and remove buttons,
 * single-value rows without a label. Spread it to replace one kind: `{ ...semiRenderers, array: MyArray }`.
 */
export const semiRenderers: Required<SchemaFieldRenderers> = {
    object: renderObject,
    array: renderArray,
    field: renderField,
};
