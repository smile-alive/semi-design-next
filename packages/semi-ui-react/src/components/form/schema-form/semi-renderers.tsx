import type React from 'react';
import { useEffect } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
import { controlProps, schemaFieldWarnings, singleItemName, type SchemaFieldKind, type SchemaFieldNode } from '@fibrae/semi-foundation/components/form/json-schema';
import { formatLocale } from '@fibrae/semi-foundation/locale';
import { warning } from '@fibrae/semi-foundation/utils';
import { IconArrowDown, IconArrowUp, IconDelete, IconPlus } from '@fibrae/semi-icons-react';
import Button from '../../button';
import useLocale from '../../locale/use-locale';
import { FormInput, FormInputNumber, FormSelect, FormSwitch, FormTextArea } from '../field';
import Section from '../section';
import type { SchemaArrayContext, SchemaFieldRenderers, SchemaLeafContext, SchemaObjectContext } from './schema-field';

const rowClass = `${cssClasses.PREFIX}-schema-array-row`;

const controls: Partial<Record<SchemaFieldKind, React.ComponentType<any>>> = {
    input: FormInput,
    textarea: FormTextArea,
    number: FormInputNumber,
    switch: FormSwitch,
    select: FormSelect,
};

const withIndex = (text: string, index: number) => formatLocale(text, { index: index + 1 });

// The root renders no Section: the Form already is its group
function NodeSection({ node, children, ...rest }: { node: SchemaFieldNode; children: React.ReactNode; 'x-field-id'?: string }) {
    const { locale } = useLocale('Form');

    if (node.field === '') return children;

    return (
        <Section extraText={node.description} text={node.title ?? withIndex(locale.item, node.item?.index ?? 0)} {...rest}>
            {children}
        </Section>
    );
}

function SemiObject({ node, content }: SchemaObjectContext) {
    return <NodeSection node={node}>{content}</NodeSection>;
}

function SemiArray({ node, items, render, add, move, count, canAdd, canRemove, fixed, fieldProps }: SchemaArrayContext) {
    const { locale } = useLocale('Form');

    return (
        <NodeSection node={node} {...fieldProps}>
            {items.map(({ key, field, index, node: rowNode, remove }) => (
                <div key={key} className={clsx(rowClass, singleItemName(rowNode, locale) !== undefined && `${rowClass}-single`)}>
                    <div className={`${rowClass}-content`}>{render(field)}</div>
                    <div className={`${rowClass}-actions`}>
                        <Button type="tertiary" aria-label={withIndex(locale.moveUpItem, index)} disabled={index === 0} theme="borderless" icon={<IconArrowUp />} onClick={() => move(index, index - 1)} />
                        <Button type="tertiary" aria-label={withIndex(locale.moveDownItem, index)} disabled={index === count - 1} theme="borderless" icon={<IconArrowDown />} onClick={() => move(index, index + 1)} />
                        {!fixed && <Button type="tertiary" aria-label={withIndex(locale.removeItem, index)} disabled={!canRemove} theme="borderless" icon={<IconDelete />} onClick={remove} />}
                    </div>
                </div>
            ))}
            {!fixed && (
                <Button disabled={!canAdd} icon={<IconPlus />} onClick={add}>
                    {locale.addItem}
                </Button>
            )}
        </NodeSection>
    );
}

function SemiField({ node }: SchemaLeafContext) {
    const { locale } = useLocale('Form');

    const Control = controls[node.kind];

    useEffect(() => {
        warning(!Control, schemaFieldWarnings.unsupported(node.field));
    }, [Control, node.field]);

    if (!Control) return null;

    const itemName = singleItemName(node, locale);
    const labelProps = itemName === undefined ? { extraText: node.description, label: { text: node.title ?? withIndex(locale.item, node.item?.index ?? 0), required: node.required } } : { noLabel: true, 'aria-label': itemName };

    return <Control field={node.field} initValue={node.default} {...labelProps} {...controlProps(node)} />;
}

/**
 * Renders SchemaField with Semi Form controls: objects and arrays as Sections, array rows with move and remove buttons,
 * single-value rows without a label. Spread it to replace one kind: `{ ...semiRenderers, array: MyArray }`.
 */
export const semiRenderers: Required<SchemaFieldRenderers> = {
    object: (context) => <SemiObject {...context} />,
    array: (context) => <SemiArray {...context} />,
    field: (context) => <SemiField {...context} />,
};
