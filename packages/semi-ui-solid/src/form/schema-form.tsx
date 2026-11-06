import { type JSX, splitProps } from 'solid-js';
import type { ExclusiveFormValidation } from '@fibrae/semi-foundation/form/interface';
import useDefaultProps from '../_base/use-default-props';
import Form from './form';
import type { FormProps } from './interface';
import SchemaField, { type SchemaFieldProps } from './schema-field';

/**
 * The Form's props without the ones that replace its content, which holds the fields here; the exclusion of
 * `schema` and `validator` sits outside the Omit, which would merge its union into one object type
 */
export type SchemaFormProps<Values extends Record<string, any> = any, Output = Values> = Omit<FormProps<Values, Output>, 'children' | 'component' | 'render'> &
    ExclusiveFormValidation &
    Pick<SchemaFieldProps, 'jsonSchema' | 'renderField' | 'widgets'> & {
        /** Rendered after the fields, such as the submit button */
        children?: JSX.Element;
    };

const defaultProps = {} satisfies Partial<SchemaFormProps>;

/** A Form rendering the fields of its JSON Schema, then its children */
export default function SchemaForm<Values extends Record<string, any> = any, Output = Values>(rawProps: SchemaFormProps<Values, Output>) {
    const props = useDefaultProps('SchemaForm', rawProps, defaultProps);
    const [local, formProps] = splitProps(props, ['children', 'jsonSchema', 'renderField', 'widgets']);

    return (
        <Form {...(formProps as FormProps<Values, Output>)}>
            <SchemaField jsonSchema={local.jsonSchema} renderField={local.renderField} widgets={local.widgets} />
            {local.children}
        </Form>
    );
}
