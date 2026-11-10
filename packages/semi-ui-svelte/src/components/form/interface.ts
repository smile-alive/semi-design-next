import type { Component, ComponentProps, Snippet } from 'svelte';
import type { HTMLAttributes, HTMLFieldsetAttributes, HTMLFormAttributes, HTMLLabelAttributes } from 'svelte/elements';
import type { Options as ScrollIntoViewOptions } from 'scroll-into-view-if-needed';
import type { FieldError } from '@fibrae/semi-foundation/components/form/errors';
import type { AllErrors, BaseFormApi, DeepPartial, ExclusiveFieldValidation, ExclusiveFormValidation, FieldPath, FieldValidateTriggerType, FieldValidator, FormState, FormValidator, StandardSchema } from '@fibrae/semi-foundation/components/form/interface';
import type { JsonSchema, SchemaFieldNode } from '@fibrae/semi-foundation/components/form/json-schema';
import type { RuleItem } from '@fibrae/semi-foundation/components/form/rules';
import type { ColProps } from '../grid/interface.js';
import type { InputGroupProps as BaseInputGroupProps, ValidateStatus } from '../input/interface.js';

export type { FieldError, FieldErrorInput } from '@fibrae/semi-foundation/components/form/errors';
export type { FieldValidateTriggerType, FieldValidator, FormState, FormValidator } from '@fibrae/semi-foundation/components/form/interface';
export type { JsonSchema, SchemaFieldKind, SchemaFieldNode } from '@fibrae/semi-foundation/components/form/json-schema';
export type { RuleItem, RuleType } from '@fibrae/semi-foundation/components/form/rules';

/** Values is what the form edits, Output what a validation of the whole form resolves with (a schema's output) */
export type FormApi<Values extends Record<string, any> = any, Output = Values> = BaseFormApi<Values, Output>;

export type ScrollOptions = ScrollIntoViewOptions;

export interface LabelProps extends Omit<HTMLLabelAttributes, 'children'> {
    /** Content of the label; the `children` snippet takes precedence */
    text?: string | number;
    align?: string;
    disabled?: boolean;
    /** Whether to display the required * symbol; hidden while `optional` is true */
    required?: boolean;
    optional?: boolean;
    name?: string;
    /** Width of the label; a number is in px */
    width?: number | string;
    children?: Snippet;
    extra?: Snippet;
}

/** A label configured by data; nodes go in the `fieldLabel` and `labelExtra` snippets */
export interface FieldLabel {
    /** The id of the label element, which the control's aria-labelledby references; generated when missing */
    id?: string;
    text?: string | number;
    align?: string;
    disabled?: boolean;
    required?: boolean;
    optional?: boolean;
    width?: number | string;
}

export interface FormRenderProps<Values extends Record<string, any> = any, Output = Values> {
    formState: FormState<Values>;
    values: Values;
    formApi: FormApi<Values, Output>;
}

export type FormProps<Values extends Record<string, any> = any, Output = Values> = AllFormProps<Values, Output> & ExclusiveFormValidation;

/** What the Form reads: global defaults can fill both exclusive sources, so the exclusion applies only to what callers pass */
export interface AllFormProps<Values extends Record<string, any> = any, Output = Values> extends Omit<HTMLFormAttributes, 'children' | 'onchange'> {
    /** Initial values of the fields, copied once when the Form is created; may leave out any part of the values */
    initValues?: DeepPartial<Values>;
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
    /** Form-level validation returning errors nested like the values; when set, it replaces the fields' own validation */
    validator?: FormValidator<Values>;
    /** A Standard Schema (zod, valibot, arktype) that replaces the fields' `validator` and `rules`, run on their `trigger` and on submit; `onSubmit` receives its output */
    schema?: StandardSchema<Values, Output>;
    /** Milliseconds a change waits before the schema validates; submit, `validate()`, blur and mount validate at once */
    schemaDebounce?: number;
    /** Whether an unmounted field or ArrayField keeps its value, error and touched state; a field's own `keepState` wins */
    keepState?: boolean;
    form?: FormApi<Values, Output>;
    /** Also written to `x-form-id`; generated when missing */
    id?: string;
    onSubmit?: (values: Output, e?: SubmitEvent) => void;
    /** `errors` is the error tree of the failed fields, or what the Form validator threw */
    onSubmitFail?: (errors: Partial<AllErrors<Values>> | unknown, values: Partial<Values>, e?: SubmitEvent) => void;
    onReset?: () => void;
    onChange?: (formState: FormState<Values>) => void;
    onValueChange?: (values: Values, changedValues: Partial<Values>) => void;
    onErrorChange?: (errors: AllErrors<Values>, changedError?: Partial<Record<FieldPath<Values>, FieldError>>) => void;
    /** Called once when the Form mounts, to save the formApi reference */
    getFormApi?: (formApi: FormApi<Values, Output>) => void;
    children?: Snippet<[FormRenderProps<Values, Output>]>;
}

/** What a field reads; callers pass `rules` or `validator`, not both (`FieldProps` applies ExclusiveFieldValidation) */
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
    /** Keeps the value, error and touched state while the field is unmounted; unset follows the ArrayField, then the Form */
    keepState?: boolean;
    allowEmptyString?: boolean;
    /** Keep the key in the form values when the value becomes undefined; falls back to the Form's `allowEmpty` */
    allowEmpty?: boolean;
    /** A changed value equal to it is stored as undefined, unless empty values are allowed; defaults to '' */
    emptyValue?: unknown;
    initValue?: unknown;
    rules?: RuleItem[];
    /** A function returning the errors, or a Standard Schema run on the field value */
    validator?: FieldValidator;
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
    fieldLabel?: Snippet;
    labelExtra?: Snippet;
    /** Shown in the error message's place while the field has no error */
    helpText?: Snippet;
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

/** Props of a field made from a component with props `P`; the exclusion stays outside Omit, which does not distribute over a union */
export type FieldProps<P> = Omit<P, keyof CommonFieldProps | ValueKeys | 'onChange' | 'insetLabel' | 'insetLabelId'> & AppendLatest<P> & TriggerContent<P> & Omit<CommonFieldProps, 'rules' | 'validator'> & ExclusiveFieldValidation;

/**
 * A Checkbox or Radio field: without `field` it is the bare control, as inside its group. `value` stays the option value
 * and `onChange` the control's own, since the field value goes through `checked`.
 */
export type OptionalFieldProps<P> = Omit<FieldProps<P>, 'field' | 'onChange'> & Pick<P, Extract<keyof P, 'value' | 'onChange'>> & { field?: string } & ExclusiveFieldValidation;

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
    /** Moves the row at `from` to `to`, its key with it; indexes out of range are clamped */
    onMove: (from: number, to: number) => void;
}

export interface ArrayFieldProps {
    field: string;
    initValue?: unknown[];
    /** Keeps the rows in the form values while the ArrayField is unmounted; unset follows the Form */
    keepState?: boolean;
    children?: Snippet<[ArrayFieldSnippetProps]>;
}

export interface ErrorMessageProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The messages, joined with commas; `['']` fails without a text, and hides the help text too */
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

export interface SectionProps extends Omit<HTMLFieldsetAttributes, 'children'> {
    text?: Snippet;
    children?: Snippet;
}

export interface SlotProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    label?: string | number | FieldLabel;
    labelPosition?: 'top' | 'left';
    noLabel?: boolean;
    error?: FieldError;
    children?: Snippet;
    fieldLabel?: Snippet;
    labelExtra?: Snippet;
    errorContent?: Snippet<[{ error: FieldError }]>;
}

export interface InputGroupProps extends Omit<BaseInputGroupProps, 'label'> {
    label?: string | number | (FieldLabel & { id?: string });
    extraTextPosition?: 'bottom' | 'middle';
    extraText?: Snippet;
}

export interface SchemaFieldRenderProps {
    node: SchemaFieldNode;
    field: string;
}

export interface SchemaFieldProps {
    /** Path of the node to render; the root by default, which renders without a Section */
    field?: string;
    /** Takes precedence over the JSON Schema exported from the Form's `schema` */
    jsonSchema?: JsonSchema;
    /**
     * Field components by `format`, then by kind (`input`, `number`, `select` ...); they receive the props of the built-in
     * control they replace
     */
    widgets?: Record<string, Component<any, any, any>>;
    /** Snippets by node pattern (`contacts[].email`); one renders the node and everything under it */
    renderField?: Record<string, Snippet<[SchemaFieldRenderProps]>>;
}

export type SchemaFormProps<Values extends Record<string, any> = any, Output = Values> = FormProps<Values, Output> & Omit<SchemaFieldProps, 'field'>;
