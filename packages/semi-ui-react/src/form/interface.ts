import type * as React from 'react';
import type { Options as ScrollIntoViewOptions } from 'scroll-into-view-if-needed';
import type { BaseFormApi as FormApi, ExclusiveFieldValidation, ExclusiveFormValidation, FieldError, FieldValidator, FormState, AllErrors, FieldPath, FieldValidateTriggerType, FormValidator, RuleItem, StandardSchema } from '@fibrae/semi-foundation/form/interface';
import type { CheckboxProps } from '../checkbox/index';
import type { RadioProps } from '../radio/index';
import type { BasicSelectValue, SelectProps } from '../select/index';
import type { LabelProps } from './label';
import type useForm from './use-form';

export type { BaseFormApi as FormApi, FieldError, FieldErrorInput, FieldValidator, FormState, FormValidator, RuleItem, RuleType } from '@fibrae/semi-foundation/form/interface';
export type { WithFieldOption } from './with-field';

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
    /** A function returning the errors (empty for valid) or a Standard Schema run on the field value; exclusive with `rules` */
    validator?: FieldValidator;
    rules?: Array<RuleItem>;
    trigger?: FieldValidateTriggerType;
    transform?: (fieldValue: any) => any;
    /** Make a second change to the component's value before the UI update */
    convert?: (fieldValue: any) => any;
    allowEmptyString?: boolean;
    /** Keep the key in the form values when the field value becomes undefined; falls back to the Form's `allowEmpty` */
    allowEmpty?: boolean;
    /** A changed value equal to this is stored as undefined, unless allowEmptyString or allowEmpty; defaults to `''` */
    emptyValue?: unknown;
    labelCol?: Record<string, any>;
    wrapperCol?: Record<string, any>;
    stopValidateWithError?: boolean;
    /* Prompt shown in the error message slot while the field has no error */
    helpText?: React.ReactNode;
    extraText?: React.ReactNode;
    extraTextPosition?: 'middle' | 'bottom';
    /** Takes over only the data stream: no ErrorMessage, Label or extraText is inserted */
    pure?: boolean;
    /** Keeps the field state (value, error, touched) after unmount and restores it on remount; unset follows the ArrayField, then the Form */
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

// `Omit` does not distribute over a union, so the exclusive `rules` and `validator` are intersected outside it
/** Props of a field component made by `withField` from a component with props `P` */
export type FieldProps<P> = Omit<P & CommonFieldProps, keyof CommonexcludeType | 'onChange'> &
    ExclusiveFieldValidation &
    // the field injects `onChange`; a caller's own handler is still accepted
    { [K in Extract<keyof P, 'onChange'>]?: WithLatestValues<P[K]> } & React.RefAttributes<any>;
export type FormSelectProps<T = BasicSelectValue, Multiple extends boolean | undefined = boolean> = Omit<SelectProps<T, Multiple> & CommonFieldProps, keyof CommonexcludeType> & ExclusiveFieldValidation;
export type FormCheckboxProps = Omit<CommonFieldProps & CheckboxProps, keyof RadioCheckboxExcludeProps> & RCIncludeType & ExclusiveFieldValidation;
export type FormRadioProps = Omit<CommonFieldProps & RadioProps, keyof RadioCheckboxExcludeProps> & RCIncludeType & ExclusiveFieldValidation;

export interface FormFCChild<K extends Record<string, any> = any, O = K> {
    formState: FormState<K>;
    values: K;
    formApi: FormApi<K, O>;
}

export interface FormHandle<Values extends Record<string, any> = any, Output = Values> {
    formApi: FormApi<Values, Output>;
}

/** Values is what the fields edit, Output what `onSubmit` receives: the output of `schema`, else the values */
export type BaseFormProps<Values extends Record<string, any> = any, Output = Values> = AllFormProps<Values, Output> & ExclusiveFormValidation;

/** Every Form prop, `schema` and `validator` together: the type inside the component, where global defaults may fill both */
export interface AllFormProps<Values extends Record<string, any> = any, Output = Values> extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'children' | 'onChange' | 'onSubmit' | 'onReset'> {
    'aria-label'?: React.AriaAttributes['aria-label'];
    onSubmit?: (values: Output, e?: React.SubmitEvent<HTMLFormElement>) => void;
    /** The field errors of the failed validation; what the Form `validator` threw, or returned when it is not an object, is passed as it is */
    onSubmitFail?: (errors: Partial<AllErrors<Values>>, values: Partial<Values>, e?: React.SubmitEvent<HTMLFormElement>) => void;
    onReset?: () => void;
    onValueChange?: (values: Values, changedValue: Partial<Values>) => void;
    onErrorChange?: (errors: AllErrors<Values>, changedError?: Partial<Record<FieldPath<Values>, FieldError>>) => void;
    onChange?: (formState: FormState<Values>) => void;
    allowEmpty?: boolean;
    /** Returns errors nested like the values (each a message or messages), empty for valid, or a Promise of them */
    validator?: FormValidator<Values>;
    /** A Standard Schema (zod, valibot, arktype) that replaces the fields' `validator` and `rules`, run on their `trigger` and on submit; `onSubmit` receives its output */
    schema?: StandardSchema<Values, Output>;
    /** Milliseconds a change waits before the `schema` validates it; submit, `validate()`, blur and mount validate at once */
    schemaDebounce?: number;
    /** The default `keepState` of the fields and ArrayFields */
    keepState?: boolean;
    initValues?: Values;
    id?: string;
    /** Called once when the Form mounts, to save the formApi reference */
    getFormApi?: (formApi: FormApi<Values, Output>) => void;
    form?: ReturnType<typeof useForm<Values, Output>>[0];
    style?: React.CSSProperties;
    className?: string;
    extraTextPosition?: 'middle' | 'bottom';
    layout?: 'horizontal' | 'vertical';
    labelPosition?: 'top' | 'left' | 'inset';
    labelWidth?: number | string;
    labelAlign?: 'left' | 'right';
    labelCol?: Record<string, any>;
    wrapperCol?: Record<string, any>;
    render?: (internalProps: FormFCChild<Values, Output>) => React.ReactNode;
    component?: React.ComponentType<any>;
    children?: React.ReactNode | ((internalProps: FormFCChild<Values, Output>) => React.ReactNode);
    autoScrollToError?: boolean | ScrollIntoViewOptions;
    disabled?: boolean;
    showValidateIcon?: boolean;
    stopValidateWithError?: boolean;
    stopPropagation?: {
        submit?: boolean;
        reset?: boolean;
    };
    trigger?: FieldValidateTriggerType;
    ref?: React.Ref<FormHandle<Values, Output>>;
}
