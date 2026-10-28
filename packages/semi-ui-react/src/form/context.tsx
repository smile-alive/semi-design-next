import type { BaseFormApi, FieldBridge, FormState } from '@fibrae/semi-foundation/form/interface';
import { createContext } from '../_base/create-context';

export const [FormStateContext, useFormStateContext] = createContext<FormState>('FormState', { defaultValue: {} });

// useFormApi and Form's field components are readable outside a Form; the empty object keeps that working
export const [FormApiContext, useFormApiContext] = createContext<BaseFormApi>('FormApi', { defaultValue: {} as BaseFormApi });

// optional: fields, Form.Slot and Form.InputGroup also render outside a Form
export const [FieldBridgeContext, useFieldBridgeContext] = createContext<FieldBridge>('FieldBridge', { optional: true });

export const [ArrayFieldContext, useArrayFieldContext] = createContext('ArrayField', {
    defaultValue: {
        shouldUseInitValue: true,
        // withField ignores `keepState` inside an ArrayField: positional paths shift on remove
        inArrayField: false,
        // the values rows read initial values from until a mounting ArrayField's own initial value is in the form state
        values: undefined as Record<string, any> | undefined,
    },
});
