import type React from 'react';
import type { ExclusiveFormValidation } from '@fibrae/semi-foundation/components/form/interface';
import { useDefaultProps } from '../../../base/index';
import Form from '../form';
import type { AllFormProps } from '../interface';
import SchemaField, { type SchemaFieldProps } from './schema-field';

export interface SchemaFormOwnProps extends Pick<SchemaFieldProps, 'jsonSchema' | 'renderers' | 'renderField'> {
    children?: React.ReactNode;
}

/** The Form props, except the ones that would replace the fields (`render`, `component`, a children function) */
export type SchemaFormProps<Values extends Record<string, any> = any, Output = Values> = Omit<AllFormProps<Values, Output>, 'children' | 'render' | 'component'> & SchemaFormOwnProps & ExclusiveFormValidation;

const defaultProps = {} satisfies Partial<SchemaFormProps>;

export default function SchemaForm<Values extends Record<string, any> = any, Output = Values>(rawProps: SchemaFormProps<Values, Output>) {
    const { jsonSchema, renderers, renderField, children, ...formProps } = useDefaultProps('SchemaForm', rawProps, defaultProps);

    return (
        <Form<Values, Output> {...formProps}>
            <SchemaField jsonSchema={jsonSchema} renderers={renderers} renderField={renderField} />
            {children}
        </Form>
    );
}
