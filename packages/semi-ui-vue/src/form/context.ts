import type { ComputedRef } from 'vue';
import type { FieldBridge, FormState } from '@fibrae/semi-foundation/components/form/interface';
import { createContext } from '../_base/create-context';
import type { AllFormProps, FormApi } from './interface';

export interface FormContextValue {
    formState: ComputedRef<FormState>;
    formProps: ComputedRef<AllFormProps>;
    formApi: FormApi;
    bridge: FieldBridge;
}

export interface ArrayFieldContextValue {
    shouldUseInitValue: boolean;
    /** The ArrayField's resolved keepState, which its row fields follow when they set none */
    keepState: boolean;
    /** The values the rows read their initial values from until the ArrayField's own mount write is rendered */
    values?: Record<string, any>;
}

export interface FormInputGroupContextValue {
    /** Adds a field to the group's error; returns the function that removes it again */
    registerField: (field: string) => () => void;
}

export const [provideFormContext, useFormContext] = createContext<FormContextValue>('Form', { optional: true });
export const [provideArrayFieldContext, useArrayFieldContext] = createContext<ComputedRef<ArrayFieldContextValue>>('ArrayField', { optional: true });
export const [provideFormInputGroupContext, useFormInputGroupContext] = createContext<FormInputGroupContextValue>('FormInputGroup', { optional: true });
