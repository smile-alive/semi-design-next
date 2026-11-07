import type { Component, IntrinsicElementAttributes, StyleValue, VNode, VNodeChild } from 'vue';
import type { Options as ScrollIntoViewOptions } from 'scroll-into-view-if-needed';
import type { AllErrors, BaseFormApi, ExclusiveFieldValidation, ExclusiveFormValidation, FieldError, FieldPath, FieldValidateTriggerType, FieldValidator, FormState, FormValidator, RuleItem, StandardSchema } from '@fibrae/semi-foundation/components/form/interface';
import type { JsonSchema, SchemaFieldNode } from '@fibrae/semi-foundation/components/form/json-schema';
import type { ColProps } from '../grid/interface';
import type { ValidateStatus } from '../input/interface';

export type { FieldError, FieldErrorInput, FieldValidateTriggerType, FieldValidator, FormState, FormValidator, RuleItem, RuleType } from '@fibrae/semi-foundation/components/form/interface';
export type { JsonSchema, SchemaFieldKind, SchemaFieldNode } from '@fibrae/semi-foundation/components/form/json-schema';

export interface LabelProps {
    /** Content of the label; the default slot takes precedence */
    text?: string | number;
    /** Extra content after the label; the `extra` slot takes precedence */
    extra?: string | number;
    align?: string;
    disabled?: boolean;
    /** Whether to display the required * symbol; hidden while `optional` is true */
    required?: boolean;
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

/** Values is what the fields edit, Output what a validation of the whole form resolves with (a schema's output) */
export type FormApi<Values extends Record<string, any> = any, Output = Values> = BaseFormApi<Values, Output>;

/** A label configured by data; nodes go in the `#fieldLabel` and `#labelExtra` slots */
export type FieldLabel = Omit<LabelProps, 'name'>;

/** The callable member is what makes Vue's compiled prop check accept arktype, whose schemas are functions */
export type FormSchema<Values, Output = Values> = StandardSchema<Values, Output> | (StandardSchema<Values, Output> & ((...args: any[]) => unknown));

export type FormProps<Values extends Record<string, any> = any, Output = Values> = AllFormProps<Values, Output> & ExclusiveFormValidation;

/** What the Form reads: global defaults can fill both exclusive sources, so the exclusion applies only to what callers pass */
export interface AllFormProps<Values extends Record<string, any> = any, Output = Values> {
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
    validator?: FormValidator<Values>;
    /** A Standard Schema (zod, valibot, arktype) that replaces the fields' `validator` and `rules`, run on their `trigger` and on submit; `submit` receives its output */
    schema?: FormSchema<Values, Output>;
    /** Milliseconds a change waits before the `schema` validates; submit, `validate()`, blur and mount validate at once */
    schemaDebounce?: number;
    /** Whether an unmounted field keeps its value, error and touched state; a Field or ArrayField `keepState` overrides it */
    keepState?: boolean;
    form?: FormApi<Values, Output>;
    /** Also written to `x-form-id`; generated when missing */
    id?: string;
}

export interface FormEmits<Values extends Record<string, any> = any, Output = Values> {
    submit: [values: Output, e?: SubmitEvent];
    /** `errors` is the error tree of the failed fields, or what the Form `validator` threw */
    submitFail: [errors: Partial<AllErrors<Values>>, values: Partial<Values>, e?: SubmitEvent];
    reset: [];
    change: [formState: FormState<Values>];
    valueChange: [values: Values, changedValues: Partial<Values>];
    errorChange: [errors: AllErrors<Values>, changedError?: Partial<Record<FieldPath<Values>, FieldError | undefined>>];
    getFormApi: [formApi: FormApi<Values, Output>];
}

export interface FormDefaultSlotProps<Values extends Record<string, any> = any, Output = Values> {
    formState: FormState<Values>;
    formApi: FormApi<Values, Output>;
    values: Values;
}

export interface FormSlots<Values extends Record<string, any> = any, Output = Values> {
    default?: (props: FormDefaultSlotProps<Values, Output>) => VNode[];
}

export interface FormHandle<Values extends Record<string, any> = any, Output = Values> {
    formApi: FormApi<Values, Output>;
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
    /** Keeps the value, error and touched state while the field is unmounted, and restores them on remount; unset follows the ArrayField, then the Form */
    keepState?: boolean;
    allowEmptyString?: boolean;
    /** Keep the key in the form values when the value becomes undefined; falls back to the Form's `allowEmpty` */
    allowEmpty?: boolean;
    /** A changed value equal to it is stored as undefined, unless empty values are allowed; defaults to '' */
    emptyValue?: unknown;
    initValue?: unknown;
    /** Exclusive with `validator` at call sites (`FieldProps`) */
    rules?: RuleItem[];
    /** A function returning the errors, or a Standard Schema run on the field value */
    validator?: FieldValidator;
    transform?: (fieldValue: any) => any;
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

type HandlerKey<E extends string> = `on${Capitalize<Camelize<E>>}`;

type AppendLatest<P, H extends string> = P extends unknown ? (H extends keyof P ? (NonNullable<P[H]> extends (...args: infer A) => any ? { [Key in H]?: (...args: [...A, latestValues: Record<string, any>]) => void } : object) : object) : never;

// ExclusiveFieldValidation stays outside every Omit: Omit does not distribute over a union and would merge the two sides
export type FieldProps<P, K extends string = 'modelValue', E extends string = 'change'> = Omit<P, keyof CommonFieldProps | ValueKeys<K> | HandlerKey<E> | 'insetLabelId'> & AppendLatest<P, HandlerKey<E>> & CommonFieldProps & ExclusiveFieldValidation & { [V in ValueKeys<K>]?: never };

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
    /** Keeps the rows in the form values while the ArrayField is unmounted, and shows them again on remount; unset follows an outer ArrayField, then the Form. The row fields follow it */
    keepState?: boolean;
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
    /** Moves the row at `from` to `to` with its key, values, errors and touched; indexes are clamped to the rows */
    onMove: (from: number, to: number) => void;
}

export interface ArrayFieldSlots {
    default?: (props: ArrayFieldSlotProps) => VNode[];
}

export interface FormErrorMessageProps {
    /** The messages are joined by ', '; `['']` is an error without a text, which renders nothing */
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

export interface SchemaFieldRenderContext {
    node: SchemaFieldNode;
    field: string;
}

/** Renders a schema node in place of the built-in control, its subtree included */
export type SchemaFieldRenderer = (context: SchemaFieldRenderContext) => VNodeChild;

/** The props SchemaForm passes on to its SchemaField */
export interface SchemaFieldSharedProps {
    /** Takes precedence over the JSON Schema exported from the Form `schema` */
    jsonSchema?: JsonSchema;
    /** Field components by `format`, then by `SchemaFieldKind`; they receive the props of the built-in control */
    widgets?: Record<string, Component>;
    /** Renderers by node pattern, array items as `[]`: `contacts[].email` */
    renderField?: Record<string, SchemaFieldRenderer>;
}

export interface SchemaFieldProps extends SchemaFieldSharedProps {
    /** Path of the node to render; the root by default */
    field?: string;
}

export type SchemaFormProps<Values extends Record<string, any> = any, Output = Values> = SchemaFieldSharedProps & FormProps<Values, Output>;
