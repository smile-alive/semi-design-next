import type { IntrinsicElementAttributes, StyleValue, VNode } from 'vue';
import type { RuleItem } from 'async-validator';
import type { Options as ScrollIntoViewOptions } from 'scroll-into-view-if-needed';
import type { AllErrors, BaseFormApi, FieldPath, FieldValidateTriggerType, FormState } from '@fibrae/semi-foundation/form/interface';
import type { ColProps } from '../grid/interface';
import type { ValidateStatus } from '../input/interface';

export type { FieldValidateTriggerType, FormState } from '@fibrae/semi-foundation/form/interface';
export type { RuleItem } from 'async-validator';

export interface LabelProps {
    /** Content of the label; the default slot takes precedence */
    text?: string | number;
    /** Extra content after the label; the `extra` slot takes precedence */
    extra?: string | number;
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
}

export interface LabelSlots {
    default?: () => VNode[];
    extra?: () => VNode[];
}

export type FormApi<Values extends Record<string, any> = any> = BaseFormApi<Values>;

/** A field error is data; render it differently with the `#error="{ error }"` slot */
export type FieldError = string | string[] | boolean | undefined;

/** Any non-empty result is an error; an empty string or undefined means valid */
export type FieldValidateResult = FieldError;

/** A label configured by data; nodes go in the `#fieldLabel` and `#labelExtra` slots */
export type FieldLabel = Omit<LabelProps, 'name'>;

type FormValidateResult<Values> = string | Partial<AllErrors<Values>>;

export interface FormProps<Values extends Record<string, any> = any> {
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
    autoScrollToError?: boolean | ScrollIntoViewOptions;
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
}

export interface FormEmits<Values extends Record<string, any> = any> {
    submit: [values: Values, e?: SubmitEvent];
    /** `errors` is what failed the validation: the form validator's result, or the field errors */
    submitFail: [errors: FormValidateResult<Values>, values: Partial<Values>, e?: SubmitEvent];
    reset: [];
    change: [formState: FormState<Values>];
    valueChange: [values: Values, changedValues: Partial<Values>];
    errorChange: [errors: AllErrors<Values>, changedError?: Partial<Record<FieldPath<Values>, FieldError>>];
    getFormApi: [formApi: FormApi<Values>];
}

export interface FormDefaultSlotProps<Values extends Record<string, any> = any> {
    formState: FormState<Values>;
    formApi: FormApi<Values>;
    values: Values;
}

export interface FormSlots<Values extends Record<string, any> = any> {
    default?: (props: FormDefaultSlotProps<Values>) => VNode[];
}

export interface FormHandle<Values extends Record<string, any> = any> {
    formApi: FormApi<Values>;
}

export interface CommonFieldProps {
    /** Path of the field's value in the form values; required except on a Checkbox or Radio inside its group */
    field: string;
    /** Defaults to the field name; the `#fieldLabel` slot takes precedence */
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
    fieldStyle?: StyleValue;
}

/** Slots the field shell consumes; every other slot reaches the wrapped component */
export interface FieldShellSlots {
    fieldLabel?: () => VNode[];
    labelExtra?: () => VNode[];
    helpText?: () => VNode[];
    extraText?: () => VNode[];
    error?: (props: { error: FieldError }) => VNode[];
}

export interface WithFieldOptions<K extends string = 'modelValue', E extends string = 'change'> {
    /** The wrapped component's value prop */
    valueKey?: K;
    /** The emit that reports a new value; the field emits it again with the latest form values appended */
    onKeyChangeFnName?: E;
    /** Where the value sits in the first argument of that emit, such as `target.checked` */
    valuePath?: string;
    /** false renders the component as is while it has no `field`, as a Checkbox inside its group */
    shouldInject?: boolean;
}

/** Keys that would give the wrapped component a second source of truth */
type ValueKeys<K extends string> = K | `onUpdate:${K}` | 'defaultValue' | 'defaultChecked' | `default${Capitalize<K>}`;

type Camelize<S extends string> = S extends `${infer Head}-${infer Tail}` ? `${Head}${Capitalize<Camelize<Tail>>}` : S;

/** The listener prop of an emit, as `toHandlerKey(camelize(name))` names it */
type HandlerKey<E extends string> = `on${Capitalize<Camelize<E>>}`;

type AppendLatest<P, H extends string> = P extends unknown ? (H extends keyof P ? (NonNullable<P[H]> extends (...args: infer A) => any ? { [Key in H]?: (...args: [...A, latestValues: Record<string, any>]) => void } : object) : object) : never;

/** Props of a field component made by `withField` from a component with props `P` and the value emit `E` */
export type FieldProps<P, K extends string = 'modelValue', E extends string = 'change'> = Omit<P, keyof CommonFieldProps | ValueKeys<K> | HandlerKey<E> | 'insetLabelId'> & AppendLatest<P, HandlerKey<E>> & CommonFieldProps & { [V in ValueKeys<K>]?: never };

/** A field's template ref; `control` is the wrapped component's own handle */
export interface FieldHandle<H = unknown> {
    readonly control: H | null;
}

type ComponentProps<C> = C extends new (...args: any) => { $props: infer P } ? P : C extends (props: infer P, ...args: any) => any ? P : C extends keyof IntrinsicElementAttributes ? IntrinsicElementAttributes[C] : never;

type ComponentSlots<C> = C extends new (...args: any) => { $slots: infer S } ? S : object;

type ComponentHandle<C> = C extends new (...args: any) => infer I ? I : unknown;

export type FieldComponent<C, K extends string = 'modelValue', E extends string = 'change'> = new () => {
    $props: FieldProps<ComponentProps<C>, K, E>;
    $slots: Omit<ComponentSlots<C>, 'insetLabel'> & FieldShellSlots;
} & FieldHandle<ComponentHandle<C>>;

export interface ArrayFieldProps {
    field: string;
    initValue?: unknown[];
}

export interface ArrayFieldItem {
    key: string;
    field: string;
    onRemove: () => void;
}

export interface ArrayFieldSlotProps {
    arrayFields: ArrayFieldItem[];
    /** Inserts an empty row before `index`, or appends one; an event argument appends */
    onAdd: (index?: number | Event) => void;
    onAddWithInitValue: (row: unknown, index?: number) => void;
}

export interface ArrayFieldSlots {
    default?: (props: ArrayFieldSlotProps) => VNode[];
}

export interface FormErrorMessageProps {
    error?: FieldError;
    showValidateIcon?: boolean;
    validateStatus?: ValidateStatus;
    isInInputGroup?: boolean;
    errorMessageId?: string;
    helpTextId?: string;
}

export interface FormErrorMessageSlots {
    helpText?: () => VNode[];
    error?: (props: { error: FieldError }) => VNode[];
}

export interface FormSectionSlots {
    default?: () => VNode[];
    text?: () => VNode[];
}

export interface FormSlotProps {
    label?: string | number | FieldLabel;
    labelPosition?: 'top' | 'left';
    noLabel?: boolean;
    error?: FieldError;
}

export interface FormSlotSlots {
    default?: () => VNode[];
    label?: () => VNode[];
    labelExtra?: () => VNode[];
    error?: (props: { error: FieldError }) => VNode[];
}

export type FormInputGroupLabel = FieldLabel & { id?: string };

export interface FormInputGroupProps {
    disabled?: boolean;
    label?: string | number | FormInputGroupLabel;
    labelPosition?: 'top' | 'left';
    extraTextPosition?: 'middle' | 'bottom';
}

export interface FormInputGroupSlots {
    default?: () => VNode[];
    label?: () => VNode[];
    labelExtra?: () => VNode[];
    extraText?: () => VNode[];
}
