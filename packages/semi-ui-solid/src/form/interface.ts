import type { JSX } from 'solid-js';
import type { FormApiProxyInternals } from '@fibrae/semi-foundation/form/form-api-proxy';
import type { AllErrors, BaseFormApi, BasicFieldError, FieldPath, FieldValidateOptions, FieldValidateTriggerType, FormState } from '@fibrae/semi-foundation/form/interface';
import type { ElementProps } from '../_base/element-props';
import type { ColProps } from '../grid';
import type { LabelProps } from './label';

export type { FieldValidateTriggerType, FormState } from '@fibrae/semi-foundation/form/interface';

export type FormApi<Values extends Record<string, any> = any> = BaseFormApi<Values>;

/** A field error: text, nodes, or a list of them; an empty string or undefined means valid */
export type FieldError = BasicFieldError | JSX.Element;

/** Any non-empty result (string, nodes, array) is an error; an empty string or undefined means valid */
export type FieldValidateResult = FieldError;

/** An async-validator rule, as the foundation validates it */
export type RuleItem = NonNullable<FieldValidateOptions['rules']>[number];

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
    /** Returns the error, an empty string or undefined for valid, or a Promise of either */
    validator?: (fieldValue: any, values: Record<string, any>) => FieldValidateResult | Promise<FieldValidateResult>;
    /** Validation rules, checked by async-validator */
    rules?: Array<RuleItem>;
    trigger?: FieldValidateTriggerType;
    /** Converts the value before validation */
    transform?: (fieldValue: any) => any;
    /** Converts the value before it is stored and shown */
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
    /** Stops checking further rules after the first one fails */
    stopValidateWithError?: boolean;
    /** Shown in the error message's place while the field has no error */
    helpText?: JSX.Element;
    /** Shown together with the error or the help text */
    extraText?: JSX.Element;
    extraTextPosition?: 'middle' | 'bottom';
    /** Takes over only the data flow: no Label, ErrorMessage or extra text is rendered */
    pure?: boolean;
    /** Keeps the value, error and touched state while the field is unmounted, and restores them on remount */
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

/** Props of a field component made by `withField` from a component with props `P` */
export type FieldProps<P> = Omit<P, keyof CommonFieldProps | ExcludedProps | 'onChange'> &
    CommonFieldProps &
    // the field injects `onChange`; a caller's own handler is still accepted
    { [K in Extract<keyof P, 'onChange'>]?: WithLatestValues<P[K]> };

/**
 * A Checkbox or Radio field: without `field` it is the bare control, as inside its group. `value` stays the option
 * value and `onChange` the control's own, since the field value goes through `checked`.
 */
export type OptionalFieldProps<P> = Omit<CommonFieldProps & P, 'defaultValue' | 'checked' | 'defaultChecked' | 'field'> & { field?: string };

export interface FormRenderProps<Values extends Record<string, any> = any> {
    formState: FormState<Values>;
    values: Values;
    formApi: FormApi<Values>;
}

export interface FormHandle<Values extends Record<string, any> = any> {
    formApi: FormApi<Values>;
}

/** The form element, with the formApi on it */
export type FormElement<Values extends Record<string, any> = any> = HTMLFormElement & FormHandle<Values>;

type FormValidateResult<Values> = string | Partial<AllErrors<Values>>;

export interface FormProps<Values extends Record<string, any> = any> extends ElementProps<'form', 'children' | 'onChange' | 'onSubmit' | 'onReset' | 'ref'> {
    onSubmit?: (values: Values, e?: SubmitEvent) => void;
    /** `errors` is what failed the validation: the form validator's result, or the field errors */
    onSubmitFail?: (errors: FormValidateResult<Values>, values: Partial<Values>, e?: SubmitEvent) => void;
    onReset?: () => void;
    onValueChange?: (values: Values, changedValue: Partial<Values>) => void;
    onErrorChange?: (errors: AllErrors<Values>, changedError?: Partial<Record<FieldPath<Values>, FieldError>>) => void;
    onChange?: (formState: FormState<Values>) => void;
    allowEmpty?: boolean;
    /** Form-level validation; when set, it replaces the fields' own validation */
    validator?: (values: Values) => FormValidateResult<Values> | Promise<FormValidateResult<Values>>;
    /** Initial values of the fields, copied once when the Form is created */
    initValues?: Values;
    /** Also written to `x-form-id`; generated when missing */
    id?: string;
    /** Called once when the Form mounts, to save the formApi reference */
    getFormApi?: (formApi: FormApi<Values>) => void;
    /** The formApi created by `Form.useForm()` */
    form?: FormApi<Values> & FormApiProxyInternals<Values>;
    extraTextPosition?: 'middle' | 'bottom';
    layout?: 'horizontal' | 'vertical';
    labelPosition?: 'top' | 'left' | 'inset';
    labelWidth?: number | string;
    labelAlign?: 'left' | 'right';
    labelCol?: ColProps;
    wrapperCol?: ColProps;
    /** Called once; read the fields of its argument in the returned JSX to follow the form state */
    render?: (props: FormRenderProps<Values>) => JSX.Element;
    /** Rendered with the form state, values and formApi as its props */
    component?: (props: FormRenderProps<Values>) => JSX.Element;
    /** A function is called once, like `render` */
    children?: JSX.Element | ((props: FormRenderProps<Values>) => JSX.Element);
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
    ref?: (element: FormElement<Values>) => void;
}
