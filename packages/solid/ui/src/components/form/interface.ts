import type { JSX } from 'solid-js';
import type { AllErrors, BaseFormApi, ExclusiveFieldValidation, ExclusiveFormValidation, FieldError, FieldPath, FieldValidateTriggerType, FormState, FormValidator, StandardSchema } from '@fibrae/semi-foundation/components/form/interface';
import type { ElementProps } from '../../base/element-props';
import type { ColProps } from '../grid';
import type { LabelProps } from './label';

export type { FieldError, FieldErrorInput, FieldValidateTriggerType, FieldValidator, FormState, FormValidator, RuleItem, RuleType } from '@fibrae/semi-foundation/components/form/interface';

/** Values is what the form edits, Output what a validation of the whole form resolves with (a schema's output) */
export type FormApi<Values extends Record<string, any> = any, Output = Values> = BaseFormApi<Values, Output>;

export type ScrollOptions = NonNullable<Parameters<BaseFormApi['scrollToField']>[1]>;

export interface CommonFieldProps {
    /** Path of the field's value in the form values; required except on a Checkbox or Radio inside its group */
    field: string;
    /** Defaults to the field name */
    label?: LabelProps | JSX.Element;
    labelPosition?: 'top' | 'left' | 'inset';
    labelAlign?: 'left' | 'right';
    labelWidth?: number | string;
    noLabel?: boolean;
    noErrorMessage?: boolean;
    name?: string;
    fieldClassName?: string;
    fieldStyle?: JSX.CSSProperties | string;
    initValue?: any;
    trigger?: FieldValidateTriggerType;
    transform?: (fieldValue: any) => any;
    convert?: (fieldValue: any) => any;
    allowEmptyString?: boolean;
    /** Keep the key in the form values when the value becomes undefined; falls back to the Form's `allowEmpty` */
    allowEmpty?: boolean;
    /** A changed value equal to it is stored as undefined, unless empty values are allowed; defaults to `''` */
    emptyValue?: unknown;
    /** Overrides the Form's `labelCol` for this field */
    labelCol?: ColProps;
    /** Overrides the Form's `wrapperCol` for this field */
    wrapperCol?: ColProps;
    stopValidateWithError?: boolean;
    /** Shown in the error message's place while the field has no error */
    helpText?: JSX.Element;
    extraText?: JSX.Element;
    extraTextPosition?: 'middle' | 'bottom';
    /** Takes over only the data flow: no Label, ErrorMessage or extra text is rendered */
    pure?: boolean;
    /**
     * Keeps the value, error and touched state while the field is unmounted, and restores them on remount. Unset, it
     * follows the enclosing ArrayField, then the Form
     */
    keepState?: boolean;
    /** Overrides the shown validation status, not the field's state */
    validateStatus?: 'default' | 'error' | 'warning' | 'success';
    /** The control's id; generated when missing, and the base of the ids the label and messages use */
    id?: string;
}

type ExcludedProps = 'defaultValue' | 'value' | 'checked' | 'defaultChecked';

// The field calls the handler with the control's arguments, padded to two, then the latest form values. A handler
// typed with rest parameters is left as it is, since its last argument has no fixed position. Known limit: optional
// parameters keep their tuple unpadded, so latestValues is typed one place early; pad per optional arity if needed.
type PadTwo<A extends unknown[]> = A['length'] extends 0 ? [undefined, undefined] : A['length'] extends 1 ? [A[0], undefined] : A;
type WithLatestValues<F> = F extends (...args: infer A) => infer R ? (number extends A['length'] ? F : (...args: [...PadTwo<A>, latestValues: Record<string, any>]) => R) : F;

/**
 * Props of a field component made by `withField` from a component with props `P`. The `rules` and `validator`
 * exclusion sits outside the Omit, which would merge its union into one object type.
 */
export type FieldProps<P> = Omit<P, keyof CommonFieldProps | keyof ExclusiveFieldValidation | ExcludedProps | 'onChange'> &
    CommonFieldProps &
    ExclusiveFieldValidation &
    // the field injects `onChange`; a caller's own handler is still accepted
    { [K in Extract<keyof P, 'onChange'>]?: WithLatestValues<P[K]> };

/**
 * A Checkbox or Radio field: without `field` it is the bare control, as inside its group. `value` stays the option
 * value and `onChange` the control's own, since the field value goes through `checked`.
 */
export type OptionalFieldProps<P> = Omit<CommonFieldProps & P, 'defaultValue' | 'checked' | 'defaultChecked' | 'field'> & { field?: string } & ExclusiveFieldValidation;

export interface FormRenderProps<Values extends Record<string, any> = any, Output = Values> {
    formState: FormState<Values>;
    values: Values;
    formApi: FormApi<Values, Output>;
}

export interface FormHandle<Values extends Record<string, any> = any, Output = Values> {
    formApi: FormApi<Values, Output>;
}

export type FormElement<Values extends Record<string, any> = any, Output = Values> = HTMLFormElement & FormHandle<Values, Output>;

export type FormProps<Values extends Record<string, any> = any, Output = Values> = AllFormProps<Values, Output> & ExclusiveFormValidation;

interface AllFormProps<Values extends Record<string, any> = any, Output = Values> extends ElementProps<'form', 'children' | 'onChange' | 'onSubmit' | 'onReset' | 'ref'> {
    /** Receives the schema's output when the Form has a `schema`, otherwise the values */
    onSubmit?: (values: Output, e?: SubmitEvent) => void;
    /** `errors` is the error tree of the failed fields; what a Form `validator` throws is passed as it is */
    onSubmitFail?: (errors: Partial<AllErrors<Values>>, values: Partial<Values>, e?: SubmitEvent) => void;
    onReset?: () => void;
    onValueChange?: (values: Values, changedValue: Partial<Values>) => void;
    onErrorChange?: (errors: AllErrors<Values>, changedError?: Partial<Record<FieldPath<Values>, FieldError>>) => void;
    onChange?: (formState: FormState<Values>) => void;
    allowEmpty?: boolean;
    /** Form-level validation returning errors nested like the values; when set, it replaces the fields' own validation */
    validator?: FormValidator<Values>;
    /** A Standard Schema (zod, valibot, arktype) that replaces the fields' `validator` and `rules`, run on their `trigger` and on submit; `onSubmit` receives its output */
    schema?: StandardSchema<Values, Output>;
    /** Milliseconds a change waits before the `schema` validation runs; submit, `validate()`, blur and mount validate at once */
    schemaDebounce?: number;
    /** Whether unmounted fields keep their value, error and touched state; Fields and ArrayFields without their own follow it */
    keepState?: boolean;
    /** Initial values of the fields, copied once when the Form is created */
    initValues?: Values;
    /** Also written to `x-form-id`; generated when missing */
    id?: string;
    /** Called once when the Form mounts, to save the formApi reference */
    getFormApi?: (formApi: FormApi<Values, Output>) => void;
    form?: FormApi<Values, Output>;
    extraTextPosition?: 'middle' | 'bottom';
    layout?: 'horizontal' | 'vertical';
    labelPosition?: 'top' | 'left' | 'inset';
    labelWidth?: number | string;
    labelAlign?: 'left' | 'right';
    labelCol?: ColProps;
    wrapperCol?: ColProps;
    /** Called once; read the fields of its argument in the returned JSX to follow the form state */
    render?: (props: FormRenderProps<Values, Output>) => JSX.Element;
    component?: (props: FormRenderProps<Values, Output>) => JSX.Element;
    /** A function is called once, like `render` */
    children?: JSX.Element | ((props: FormRenderProps<Values, Output>) => JSX.Element);
    autoScrollToError?: boolean | ScrollOptions;
    disabled?: boolean;
    showValidateIcon?: boolean;
    stopValidateWithError?: boolean;
    stopPropagation?: {
        submit?: boolean;
        reset?: boolean;
    };
    trigger?: FieldValidateTriggerType;
    /** Receives the form element, with the formApi on it */
    ref?: (element: FormElement<Values, Output>) => void;
}
