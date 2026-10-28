import type { Accessor } from 'solid-js';
import type { FieldBridge } from '@fibrae/semi-foundation/form/interface';
import { createContext } from '../_base/create-context';
import type { FormApi, FormProps, FormState } from './interface';

export interface FormContextValue {
    formState: Accessor<FormState>;
    /** The Form props with their defaults resolved, read by the fields while rendering */
    formProps: FormProps;
    formApi: FormApi;
    bridge: FieldBridge;
}

export interface ArrayFieldContextValue {
    shouldUseInitValue: Accessor<boolean>;
    /** The values the rows read their initial values from until the ArrayField's own mount write is rendered */
    values: Accessor<Record<string, any> | undefined>;
}

/** The ids Form.InputGroup adds to each field's own aria references */
export interface FormInputGroupAria {
    labelledby?: string;
    describedby?: string;
    errormessage: string;
}

export interface FormInputGroupContextValue {
    /** Adds a field to the group's error; returns the function that removes it again */
    registerField: (field: string) => () => void;
    aria: Accessor<FormInputGroupAria>;
}

// optional: fields, Form.Slot and Form.InputGroup also render outside a Form
export const [FormContext, useFormContext] = createContext<FormContextValue>('Form', { optional: true });
export const [ArrayFieldContext, useArrayFieldContext] = createContext<ArrayFieldContextValue>('ArrayField', { optional: true });
export const [FormInputGroupContext, useFormInputGroupContext] = createContext<FormInputGroupContextValue>('FormInputGroup', { optional: true });
