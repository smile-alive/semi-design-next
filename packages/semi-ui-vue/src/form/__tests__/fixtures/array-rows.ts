import { h } from 'vue';
import { ArrayField, type ArrayFieldSlotProps } from '../..';
import Button from '../../../button';
import { FormInput, renderForm } from './fields';

export const newLine = { name: 'yx', type: 'rd' };

interface Options {
    formProps?: Record<string, unknown>;
    arrayFieldProps?: Record<string, unknown>;
    fieldProps?: Record<string, unknown>;
}

/** A Form with the ArrayField `data`: two buttons, then a name input, a type input and a remove button per row */
export function renderArrayForm({ formProps = {}, arrayFieldProps = {}, fieldProps = {} }: Options = {}) {
    return renderForm(formProps, () =>
        h(
            ArrayField,
            { field: 'data', ...arrayFieldProps },
            {
                default: ({ arrayFields, onAdd, onAddWithInitValue }: ArrayFieldSlotProps) => [
                    h(Button, { class: 'addEmptyLine', onClick: onAdd }, () => 'Add Empty Line'),
                    h(Button, { class: 'addLine', onClick: () => onAddWithInitValue(newLine) }, () => 'Add line with setting value'),
                    ...arrayFields.map(({ field, key, onRemove }) => h('div', { key }, [h(FormInput, { field: `${field}[name]`, ...fieldProps }), h(FormInput, { field: `${field}[type]`, ...fieldProps }), h(Button, { type: 'danger', onClick: onRemove })])),
                ],
            }
        )
    );
}

export const getFieldInput = (fieldPath: string) => document.querySelector<HTMLInputElement>(`.semi-form-field[x-field-id="${fieldPath}"] .semi-input`);
