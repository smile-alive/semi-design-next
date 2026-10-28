import type * as React from 'react';
import type { RuleItem } from 'async-validator';
import type { Options as ScrollIntoViewOptions } from 'scroll-into-view-if-needed';
import type { BaseFormApi as FormApi, FormState, AllErrors, FieldPath, FieldValidateTriggerType } from '@fibrae/semi-foundation/form/interface';
import type { CheckboxProps } from '../checkbox/index';
import type { RadioProps } from '../radio/index';
import type { BasicSelectValue, SelectProps } from '../select/index';
import type { ReactFieldError as FieldError } from './error-message';
import type useForm from './hooks/use-form';
import type { LabelProps } from './label';

export type { BaseFormApi as FormApi, FormState } from '@fibrae/semi-foundation/form/interface';
export type { WithFieldOption } from './hoc/with-field';
export type { RuleItem } from 'async-validator';

/** Any non-empty result (string, ReactNode, array) is an error; an empty string or undefined means valid */
export type FieldValidateResult = FieldError;

export type CommonFieldProps = {
    /** Field is required (except Form. Checkbox within the Group, Form. Radio) */
    field: string;
    /** The label text of the form control is the same name as the field by default when it is not passed */
    label?: LabelProps | React.ReactNode;
    labelPosition?: 'top' | 'left' | 'inset';
    labelAlign?: 'left' | 'right';
    labelWidth?: number | string;
    noLabel?: boolean;
    noErrorMessage?: boolean;
    name?: string;
    fieldClassName?: string;
    fieldStyle?: React.CSSProperties;
    initValue?: any;
    /**
     * Custom field validation function
     * @param fieldValue - The current field value
     * @param values - All form values
     * @returns Error message string, empty string for valid, or Promise that resolves to error message
     */
    validator?: (fieldValue: any, values: Record<string, any>) => FieldValidateResult | Promise<FieldValidateResult>;
    /** Check rules, check library based on async-validator */
    rules?: Array<RuleItem>;
    /** Check trigger timing */
    trigger?: FieldValidateTriggerType;
    /** Converts form control values before validation */
    transform?: (fieldValue: any) => any;
    /** Make a second change to the component's value before the UI update */
    convert?: (fieldValue: any) => any;
    allowEmptyString?: boolean;
    /** Keep the key in the form values when the field value becomes undefined; falls back to the Form's `allowEmpty` */
    allowEmpty?: boolean;
    /** A changed value equal to this is stored as undefined, unless allowEmptyString or allowEmpty; defaults to `''` */
    emptyValue?: unknown;
    /** Overrides the Form's `labelCol` for this field */
    labelCol?: Record<string, any>;
    /** Overrides the Form's `wrapperCol` for this field */
    wrapperCol?: Record<string, any>;
    /** Stops checking further rules after the first one fails */
    stopValidateWithError?: boolean;
    /* Prompt shown in the error message slot while the field has no error */
    helpText?: React.ReactNode;
    /* Extra message shown together with the error and prompt text, after helpText/errorMessage */
    extraText?: React.ReactNode;
    extraTextPosition?: 'middle' | 'bottom';
    /** Takes over only the data stream: no ErrorMessage, Label or extraText is inserted */
    pure?: boolean;
    /** Keeps the field state (value, error, touched) after unmount and restores it on remount */
    keepState?: boolean;
};

export type CommonexcludeType = {
    defaultValue?: any;
    value?: any;
    checked?: boolean;
    defaultChecked?: boolean;
};

export type RadioCheckboxExcludeProps = {
    defaultValue?: any;
    checked?: boolean;
    defaultChecked?: boolean;
    field: string;
};

export type RCIncludeType = {
    field?: string;
};

// The field calls the handler with the control's arguments, padded to two, then the latest form values. A handler
// typed with rest parameters is left as it is, since its last argument has no fixed position. Known limit: optional
// parameters keep their tuple unpadded, so latestValues is typed one place early; pad per optional arity if needed.
type PadTwo<A extends unknown[]> = A['length'] extends 0 ? [undefined, undefined] : A['length'] extends 1 ? [A[0], undefined] : A;
type WithLatestValues<F> = F extends (...args: infer A) => infer R ? (number extends A['length'] ? F : (...args: [...PadTwo<A>, latestValues: Record<string, any>]) => R) : F;

/** Props of a field component made by `withField` from a component with props `P` */
export type FieldProps<P> = Omit<P & CommonFieldProps, keyof CommonexcludeType | 'onChange'> &
    // the field injects `onChange`; a caller's own handler is still accepted
    { [K in Extract<keyof P, 'onChange'>]?: WithLatestValues<P[K]> } & React.RefAttributes<any>;
export type FormSelectProps<T = BasicSelectValue, Multiple extends boolean | undefined = boolean> = Omit<SelectProps<T, Multiple> & CommonFieldProps, keyof CommonexcludeType>;
export type FormCheckboxProps = Omit<CommonFieldProps & CheckboxProps, keyof RadioCheckboxExcludeProps> & RCIncludeType;
export type FormRadioProps = Omit<CommonFieldProps & RadioProps, keyof RadioCheckboxExcludeProps> & RCIncludeType;

export interface ErrorMsg {
    [optionalKey: string]: FieldError;
}
export interface FormFCChild<K extends Record<string, any> = any> {
    formState: FormState<K>;
    values: K;
    formApi: FormApi<K>;
}

type BatchValidateResult<Values> = string | Partial<AllErrors<Values>>;

export interface FormHandle<Values extends Record<string, any> = any> {
    formApi: FormApi<Values>;
}

export interface BaseFormProps<Values extends Record<string, any> = any> extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'children' | 'onChange' | 'onSubmit' | 'onReset'> {
    'aria-label'?: React.AriaAttributes['aria-label'];
    onSubmit?: (values: Values, e?: React.SubmitEvent<HTMLFormElement>) => void;
    /** `errors` is what failed the validation: the form validator's result, or the field errors */
    onSubmitFail?: (errors: BatchValidateResult<Values>, values: Partial<Values>, e?: React.SubmitEvent<HTMLFormElement>) => void;
    onReset?: () => void;
    onValueChange?: (values: Values, changedValue: Partial<Values>) => void;
    onErrorChange?: (errors: AllErrors<Values>, changedError?: Partial<Record<FieldPath<Values>, FieldError>>) => void;
    onChange?: (formState: FormState<Values>) => void;
    allowEmpty?: boolean;
    /**
     * Custom form-level validation function
     * @param values - All form values
     * @returns Errors nested like the values, an empty object or empty string for valid, or Promise that resolves to errors
     */
    validator?: (values: Values) => BatchValidateResult<Values> | Promise<BatchValidateResult<Values>>;
    /** Use this if you want to populate the form with initial values. */
    initValues?: Values;
    id?: string;
    /** Called once when the Form mounts, to save the formApi reference */
    getFormApi?: (formApi: FormApi<Values>) => void;
    /** External formApi created by Form.useForm() */
    form?: ReturnType<typeof useForm<Values>>[0];
    style?: React.CSSProperties;
    className?: string;
    extraTextPosition?: 'middle' | 'bottom';
    layout?: 'horizontal' | 'vertical';
    labelPosition?: 'top' | 'left' | 'inset';
    labelWidth?: number | string;
    labelAlign?: 'left' | 'right';
    labelCol?: Record<string, any>;
    wrapperCol?: Record<string, any>;
    render?: (internalProps: FormFCChild<Values>) => React.ReactNode;
    component?: React.ComponentType<any>;
    children?: React.ReactNode | ((internalProps: FormFCChild<Values>) => React.ReactNode);
    autoScrollToError?: boolean | ScrollIntoViewOptions;
    disabled?: boolean;
    showValidateIcon?: boolean;
    stopValidateWithError?: boolean;
    stopPropagation?: {
        submit?: boolean;
        reset?: boolean;
    };
    trigger?: FieldValidateTriggerType;
    /** Receives `{ formApi }` */
    ref?: React.Ref<FormHandle<Values>>;
}
