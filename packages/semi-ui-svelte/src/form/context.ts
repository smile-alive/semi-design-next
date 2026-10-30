import type { FieldBridge, FormState } from '@fibrae/semi-foundation/form/interface';
import { createContext } from '../_base/create-context.js';
import type { FormApi, FormProps } from './interface.js';

export interface FormContextValue {
    readonly formState: FormState;
    /** The Form props with their defaults resolved, read by the fields while rendering */
    readonly formProps: FormProps;
    formApi: FormApi;
    bridge: FieldBridge;
}

export interface ArrayFieldContextValue {
    readonly shouldUseInitValue: boolean;
    /** The values the rows read their initial values from until the ArrayField's own mount write is rendered */
    readonly values?: Record<string, any>;
}

/** The ids FormInputGroup adds to each field's own aria references */
export interface FormInputGroupAria {
    labelledby?: string;
    describedby?: string;
    errormessage: string;
}

export interface FormInputGroupContextValue {
    /** Adds a field to the group's error; returns the function that removes it again */
    registerField: (field: string) => () => void;
    readonly aria: FormInputGroupAria;
}

// optional: fields, FormSlot and FormInputGroup also render outside a Form
export const [getFormContext, setFormContext] = createContext<FormContextValue>('Form', { optional: true });
export const [getArrayFieldContext, setArrayFieldContext] = createContext<ArrayFieldContextValue>('ArrayField', { optional: true });
export const [getFormInputGroupContext, setFormInputGroupContext] = createContext<FormInputGroupContextValue>('FormInputGroup', { optional: true });
