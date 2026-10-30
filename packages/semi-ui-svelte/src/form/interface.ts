import type { Component, ComponentProps, Snippet } from 'svelte';
import type { HTMLAttributes, HTMLFormAttributes, HTMLLabelAttributes } from 'svelte/elements';
import type { RuleItem } from 'async-validator';
import type { Options as ScrollIntoViewOptions } from 'scroll-into-view-if-needed';
import type { AllErrors, BaseFormApi, FieldPath, FieldValidateTriggerType, FormState } from '@fibrae/semi-foundation/form/interface';
import type { ColProps } from '../grid/interface.js';
import type { InputGroupProps as BaseInputGroupProps, ValidateStatus } from '../input/interface.js';

export type { FieldValidateTriggerType, FormState } from '@fibrae/semi-foundation/form/interface';
export type { RuleItem } from 'async-validator';

export type FormApi<Values extends Record<string, any> = any> = BaseFormApi<Values>;

export type ScrollOptions = ScrollIntoViewOptions;

/** A field error is data; render it differently with the `error` snippet */
export type FieldError = string | string[] | boolean | undefined;

/** Any non-empty result is an error; an empty string or undefined means valid */
export type FieldValidateResult = FieldError;

export interface LabelProps extends Omit<HTMLLabelAttributes, 'children'> {
    /** Content of the label; the `children` snippet takes precedence */
    text?: string | number;
    /** text-align of the label */
    align?: string;
    disabled?: boolean;
    /** Whether to display the required * symbol; hidden while `optional` is true */
    required?: boolean;
    /** Appends the locale's optional text */
    optional?: boolean;
    /** The id of the labeled field, written to the `for` attribute */
    name?: string;
    /** Width of the label; a number is in px */
    width?: number | string;
    children?: Snippet;
    extra?: Snippet;
}

/** A label configured by data; nodes go in the `fieldLabel` and `labelExtra` snippets */
export interface FieldLabel {
    text?: string | number;
    align?: string;
    disabled?: boolean;
    required?: boolean;
    optional?: boolean;
    width?: number | string;
}

export interface FormRenderProps<Values extends Record<string, any> = any> {
    formState: FormState<Values>;
    values: Values;
    formApi: FormApi<Values>;
}

type FormValidateResult<Values> = string | Partial<AllErrors<Values>>;

export interface FormProps<Values extends Record<string, any> = any> extends Omit<HTMLFormAttributes, 'children' | 'onchange' | 'onsubmit' | 'onreset'> {
    /** Initial values of the fields, copied once when the Form is created */
    initValues?: Values;
    layout?: 'horizontal' | 'vertical';
    labelPosition?: 'top' | 'left' | 'inset';
    labelWidth?: number | string;
    labelAlign?: 'left' | 'right';
    labelCol?: ColProps;
    wrapperCol?: ColProps;
    extraTextPosition?: 'middle' | 'bottom';
    /** Keep the key in the form values when a field value becomes undefined */
    allowEmpty?: boolean;
    autoScrollToError?: boolean | ScrollOptions;
    showValidateIcon?: boolean;
    disabled?: boolean;
    stopValidateWithError?: boolean;
    trigger?: FieldValidateTriggerType;
    stopPropagation?: { submit?: boolean; reset?: boolean };
    /** Form-level validation; when set, it replaces the fields' own validation */
    validator?: (values: Values) => FormValidateResult<Values> | Promise<FormValidateResult<Values>>;
    /** The `formApi` returned by `useForm()` */
    form?: FormApi<Values>;
    /** Also written to `x-form-id`; generated when missing */
    id?: string;
    onSubmit?: (values: Values, e?: SubmitEvent) => void;
    /** `errors` is what failed the validation: the form validator's result, or the field errors */
    onSubmitFail?: (errors: FormValidateResult<Values>, values: Partial<Values>, e?: SubmitEvent) => void;
    onReset?: () => void;
    onChange?: (formState: FormState<Values>) => void;
    onValueChange?: (values: Values, changedValues: Partial<Values>) => void;
    onErrorChange?: (errors: AllErrors<Values>, changedError?: Partial<Record<FieldPath<Values>, FieldError>>) => void;
    /** Called once when the Form mounts, to save the formApi reference */
    getFormApi?: (formApi: FormApi<Values>) => void;
    children?: Snippet<[FormRenderProps<Values>]>;
}

export interface CommonFieldProps {
    /** Path of the field's value in the form values; required except on a Checkbox or Radio inside its group */
    field: string;
    /** Defaults to the field name; the `fieldLabel` snippet takes precedence */
    label?: string | number | FieldLabel;
    labelPosition?: 'top' | 'left' | 'inset';
    labelAlign?: 'left' | 'right';
    labelWidth?: number | string;
    labelCol?: ColProps;
    wrapperCol?: ColProps;
    noLabel?: boolean;
    noErrorMessage?: boolean;
    /** Takes over only the data flow: no Label, ErrorMessage or extra text, the DOM of the bare component */
    pure?: boolean;
    /** Keeps the value, error and touched state while the field is unmounted, and restores them on remount */
    keepState?: boolean;
    allowEmptyString?: boolean;
    /** Keep the key in the form values when the value becomes undefined; falls back to the Form's `allowEmpty` */
    allowEmpty?: boolean;
    /** A changed value equal to it is stored as undefined, unless empty values are allowed; defaults to '' */
    emptyValue?: unknown;
    initValue?: unknown;
    rules?: RuleItem[];
    validator?: (fieldValue: any, values: Record<string, any>) => FieldValidateResult | Promise<FieldValidateResult>;
    /** Converts the value before validation */
    transform?: (fieldValue: any) => any;
    /** Converts the value before it is stored and shown */
    convert?: (fieldValue: any) => any;
    trigger?: FieldValidateTriggerType;
    stopValidateWithError?: boolean;
    extraTextPosition?: 'middle' | 'bottom';
    /** Overrides the shown validation status, not the field's state */
    validateStatus?: ValidateStatus;
    name?: string;
    /** The control's id; generated when missing, and the base of the ids the label and messages use */
    id?: string;
    fieldClassName?: string;
    fieldStyle?: string;
    /** Replaces the label text */
    fieldLabel?: Snippet;
    labelExtra?: Snippet;
    /** Shown in the error message's place while the field has no error */
    helpText?: Snippet;
    /** Shown together with the error or the help text */
    extraText?: Snippet;
    /** Renders the error; the default joins the messages with commas */
    error?: Snippet<[{ error: FieldError }]>;
}

/** How a field reaches the wrapped component */
export interface WithFieldOption {
    /**
     * The wrapped component's bindable value prop. Shortcut: Svelte cannot bind a prop named at runtime, so only these
     * three are supported; add a branch to field.svelte for another one.
     */
    valueKey?: 'value' | 'checked' | 'fileList';
    /** The wrapped component's change callback; `onChange` by default */
    onKeyChangeFnName?: string;
    /**
     * The wrapped component's blur callback: `onBlur` by default, `onblur` for a component that forwards native ones, an
     * empty string for a component without one
     */
    onBlurFnName?: string;
    /** Where the value sits in the callback's first argument, such as `target.checked` for an event */
    valuePath?: string;
    /** false: without `field` the component renders bare, as a Checkbox or Radio inside its group */
    shouldInject?: boolean;
    /** false: the component renders no inset label, so labelPosition 'inset' falls back to 'top' */
    insetLabel?: boolean;
    /** false: the component has no `validateStatus` prop, which would otherwise land on its DOM */
    validateStatus?: boolean;
}

/** Keys that would give the wrapped component a second source of truth; the field's `initValue` replaces native `default*` */
type ValueKeys = 'value' | 'checked' | 'fileList' | 'defaultValue' | 'defaultChecked';

type AppendLatest<P> = 'onChange' extends keyof P ? (NonNullable<P['onChange']> extends (...args: infer A) => any ? { onChange?: (...args: [...A, latestValues: Record<string, any>]) => void } : object) : object;

/** The field's own `trigger` is the validation timing, so a control's `trigger` snippet is passed as `triggerContent` */
type TriggerContent<P> = 'trigger' extends keyof P ? { triggerContent?: P['trigger'] } : object;

/** Props of a field made from a component with props `P` */
export type FieldProps<P> = Omit<P, keyof CommonFieldProps | ValueKeys | 'onChange' | 'insetLabel' | 'insetLabelId'> & AppendLatest<P> & TriggerContent<P> & CommonFieldProps;

/**
 * A Checkbox or Radio field: without `field` it is the bare control, as inside its group. `value` stays the option value
 * and `onChange` the control's own, since the field value goes through `checked`.
 */
export type OptionalFieldProps<P> = Omit<FieldProps<P>, 'field' | 'onChange'> & Pick<P, Extract<keyof P, 'value' | 'onChange'>> & { field?: string };

/** Props of `FormField`: a field around any component */
export type FormFieldProps<C extends Component<any, any, any>> = FieldProps<ComponentProps<C>> & {
    component: C;
    fieldOptions?: WithFieldOption;
};

export interface ArrayFieldItem {
    key: string;
    field: string;
    onRemove: () => void;
}

export interface ArrayFieldSnippetProps {
    arrayFields: ArrayFieldItem[];
    /** Inserts an empty row before `index`, or appends one; an event argument appends */
    onAdd: (index?: number | Event) => void;
    onAddWithInitValue: (row: unknown, index?: number) => void;
}

export interface ArrayFieldProps {
    field: string;
    initValue?: unknown[];
    children?: Snippet<[ArrayFieldSnippetProps]>;
}

export interface ErrorMessageProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    error?: FieldError;
    showValidateIcon?: boolean;
    validateStatus?: ValidateStatus;
    isInInputGroup?: boolean;
    /** The id of the error text, the target of the control's aria-errormessage */
    errorMessageId?: string;
    /** The id of the help text, the target of the control's aria-describedby */
    helpTextId?: string;
    helpText?: Snippet;
    errorContent?: Snippet<[{ error: FieldError }]>;
}

export interface SectionProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
    text?: Snippet;
    children?: Snippet;
}

export interface SlotProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    label?: string | number | FieldLabel;
    labelPosition?: 'top' | 'left';
    noLabel?: boolean;
    error?: FieldError;
    children?: Snippet;
    /** Replaces the label text */
    fieldLabel?: Snippet;
    labelExtra?: Snippet;
    errorContent?: Snippet<[{ error: FieldError }]>;
}

export interface InputGroupProps extends Omit<BaseInputGroupProps, 'label'> {
    label?: string | number | (FieldLabel & { id?: string });
    extraTextPosition?: 'bottom' | 'middle';
    extraText?: Snippet;
}
