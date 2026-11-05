import type { Options as ScrollIntoViewOptions } from 'scroll-into-view-if-needed';
import type { DefaultAdapter } from '../base/foundation';
import type FieldStore from './field-store';

export type BasicTriggerType = 'blur' | 'change' | 'custom' | 'mount';

export type FieldValidateTriggerType = BasicTriggerType | Array<BasicTriggerType>;

export type CommonFieldError = boolean | string | Array<any> | undefined | unknown;

export type BasicFieldError = Array<any>;

export interface StandardSchemaIssue {
    readonly message: string;
    readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }>;
}

export type StandardSchemaResult<Output> = { readonly value: Output; readonly issues?: undefined } | { readonly value?: undefined; readonly issues: ReadonlyArray<StandardSchemaIssue> };

/** The part of Standard Schema v1 (https://standardschema.dev) the Form calls; zod, valibot and arktype implement it */
export interface StandardSchema<Output = any> {
    readonly '~standard': {
        readonly version: 1;
        readonly vendor: string;
        readonly validate: (value: unknown) => StandardSchemaResult<Output> | Promise<StandardSchemaResult<Output>>;
    };
}

/**
 * A Form validates from one source. The types catch `schema` with the Form `validator`; the `rules` and `validator` of
 * a field sit on another component, out of their reach, so the foundation warns when such a field registers.
 */
export type ExclusiveFormValidation = { schema?: never } | { validator?: never };

/** E is the host's submit event, which the foundation only passes through; a submit by API has none */
export interface BaseFormAdapter<P = Record<string, any>, S = Record<string, any>, Values extends object = any, E = unknown> extends DefaultAdapter<P, S> {
    cloneDeep: (val: any, ...rest: any[]) => any;
    notifySubmit: (values: any, e?: E) => void;
    notifySubmitFail: (errors: string | Partial<AllErrors<Values>>, values: Partial<Values>, e?: E) => void;
    /** Renders the form again from `formState`; `callback` runs once that render is committed */
    forceUpdate: (formState: FormState, callback?: () => void) => void;
    notifyChange: (formState: FormState) => void;
    notifyValueChange: (values: any, changedValues: any) => void;
    notifyErrorChange: (errors: any, changedError: any) => void;
    notifyReset: () => void;
    getInitValues: () => Partial<Values>;
    getFormProps: (keys?: Array<string>) => any;
    /** The rendered form element; null before mount and after unmount */
    getFormElement: () => Element | null;
}

// Dates, files, functions and DOM objects are values, not containers; a Window's key graph alone exceeds the checker's
// union limit
type OpaqueValue = Date | Blob | FileList | ((...args: never[]) => unknown) | EventTarget;

// Errors and touched mirror the values: an object or array holds the entries of the fields under it, and a field
// holding it as a whole has its own entry in its place
type FieldStateTree<T, Leaf> = { [K in keyof T]?: Leaf | NestedFieldState<T[K], Leaf> };

type NestedFieldState<V, Leaf> = 0 extends 1 & V ? any : V extends OpaqueValue ? never : V extends readonly (infer E)[] ? Array<Leaf | NestedFieldState<E, Leaf> | undefined> : V extends object ? FieldStateTree<V, Leaf> : never;

export type AllErrors<T> = T extends Record<string, any> ? FieldStateTree<T, string> : Record<string, any>;

export interface FormState<T extends Record<string, any> = any> {
    values?: T extends Record<string, any> ? T : Record<string, any>;
    errors?: AllErrors<T>;
    touched?: T extends Record<string, any> ? FieldStateTree<T, boolean> : Record<string, any>;
}
export interface setValuesConfig {
    isOverride: boolean;
}

// Remaining nesting budget, indexed by the current one: entering an array item or an object's keys costs 1, so
// `a[0].b[1].c` uses 4. Recursive value types would otherwise expand forever, and the union grows as
// branches^depth: a type with four recursive fields takes 0.5s to check at 5, 7s at 6.
type PathDepth = [never, 0, 1, 2, 3, 4];

// What may follow a field holding V: `[n]` for array items (the form the field paths use), `.key` for object keys
type SubPath<V, D extends number> = [D] extends [never] ? never : V extends readonly (infer E)[] ? `[${number}]` | `[${number}]${SubPath<E, PathDepth[D]>}` : V extends OpaqueValue ? never : V extends object ? `.${FieldPath<V, PathDepth[D]>}` : never;

// Paths of an object's fields: `a.b` into objects, `a[0]` and `a[0].b` into arrays. An untyped (`any`) form takes
// any string.
export type FieldPath<T, D extends number = 5> = 0 extends 1 & T ? string : T extends object ? { [K in keyof T & string]-?: K | `${K}${SubPath<T[K], D>}` }[keyof T & string] : never;

// `a[0].b` names the same value as `a.0.b`
type DotPath<P extends string> = P extends `${infer A}[${infer I}]${infer B}` ? DotPath<`${A}.${I}${B}`> : P;

type PathStep<T, K extends string> = T extends readonly (infer E)[] ? (K extends `${number}` ? E : never) : K extends keyof T ? T[K] : never;

type ValueAtPath<T, P extends string> = P extends `${infer K}.${infer Rest}` ? ValueAtPath<PathStep<T, K>, Rest> : PathStep<T, P>;

export type FieldPathValue<T, P extends FieldPath<T>> = ValueAtPath<T, DotPath<P>>;

export type ScrollToErrorOptions<K> = {
    field?: K;
    index?: number;
    scrollOpts?: ScrollIntoViewOptions;
};

export interface ValidateOptions<K extends keyof any = keyof any> {
    /** Fields to validate, if not specified, validate all fields */
    fields?: Array<K>;
    /** Whether to validate silently (without updating UI or setting touched state) */
    silent?: boolean;
}

export interface BaseFormApi<T extends object = any> {
    getValue: <P extends FieldPath<T>>(field?: P) => FieldPathValue<T, P>;
    setValue: <K extends FieldPath<T>>(field: K, newFieldValue: any) => void;
    getError: <K extends FieldPath<T>>(field: K) => any;
    setError: <K extends FieldPath<T>>(field: K, fieldError: any) => void;
    getTouched: <K extends FieldPath<T>>(field: K) => boolean;
    /** A parent path takes the nested touched object of its fields */
    setTouched: <K extends FieldPath<T>>(field: K, fieldTouch: boolean | Record<string, any>) => void;
    getFieldExist: <K extends FieldPath<T>>(field: K) => boolean;
    getFormState: () => FormState<T extends object ? T : object>;
    getFormProps: (keys?: Array<string>) => ComponentProps;
    submitForm: () => void;
    reset: (fields?: Array<string>) => void;
    /** Resolves with the form values; validating all fields against a Form `schema` resolves with the schema's output */
    validate: <K extends FieldPath<T>>(fields?: Array<K> | ValidateOptions<K>) => Promise<T>;
    /** Without a field, returns all the initial values */
    getInitValue: <K extends FieldPath<T>>(field?: K) => any;
    getInitValues: () => any;
    getValues: () => T;
    setValues: (fieldsValue: Partial<T>, config?: setValuesConfig) => void;
    scrollToField: <K extends FieldPath<T>>(field: K, scrollConfig?: ScrollIntoViewOptions) => void;
    scrollToError: <K extends FieldPath<T>>(config?: ScrollToErrorOptions<K>) => void;
}

export interface CallOpts {
    [x: string]: any;
    /** Skip the onChange / onValueChange / onErrorChange notifications */
    skipNotify?: boolean;
    /** Write the form state without rendering it */
    skipRender?: boolean;
    needClone?: boolean;
    allowEmpty?: boolean;
    /** A validation result: the field shows this status even when its error value is unchanged */
    status?: 'success' | 'error';
}

export interface ComponentProps {
    [x: string]: any;
}

export interface FieldSnapshot {
    value?: any;
    error?: any;
    touched?: boolean;
    status?: 'default' | 'error' | 'success' | 'warning' | 'validating';
}

/** The validation props of a field, as of its latest render */
export interface FieldValidateOptions {
    rules?: Array<any>;
    validate?: (value: any, values: any) => unknown;
    transform?: (value: any) => any;
    stopValidateWithError?: boolean;
}

export interface FieldRegistration {
    /** Identifies the field component instance, which a remounted field of the same name does not share */
    id: string;
    field: string;
    store: FieldStore;
    initValue?: any;
    valuePath?: string;
    keepState: boolean;
    allowEmpty: boolean;
    getValidateOptions: () => FieldValidateOptions;
    getChangeOptions: () => FieldChangeOptions;
}

export interface FieldChangeOptions {
    allowEmpty?: boolean;
    allowEmptyString?: boolean;
    emptyValue?: any;
    convert?: (value: any) => any;
}

export interface ChangeFieldValueOptions {
    allowEmpty?: boolean;
    /** Validate the committed value, for a field triggered by change */
    validate?: boolean;
    /** The field's onChange; it reads the new value through the form api or `latestValues` */
    onChange: (latestValues: Record<string, any>) => void;
}

export interface ArrayFieldRegistration {
    field: string;
    updateKey?: number;
    initValue?: any;
}
export interface FieldBridge {
    register: (field: string, registration: FieldRegistration) => void;
    unRegister: (field: string) => void;
    setFieldTouched: (registration: FieldRegistration, touched: boolean, opts?: CallOpts) => void;
    validateField: (registration: FieldRegistration, value: any, opts?: CallOpts) => Promise<unknown> | null;
    changeFieldValue: (registration: FieldRegistration, value: any, opts: ChangeFieldValueOptions) => void;
    getValue: (field?: string, opts?: CallOpts) => any;
    getError: (field?: string) => any;
    getTouched: (field?: string) => boolean | Record<string, any> | undefined;
    getInitValues: () => any;
    getInitValue: (field?: string) => any;
    getFormProps: (keys?: Array<string>) => ComponentProps;
    getField: (field: string) => FieldRegistration | undefined;
    registerArrayField: (arrayFieldPath: string, val: any) => void;
    mountArrayField: (arrayFieldPath: string, val: any) => void;
    unRegisterArrayField: (arrayField: string) => void;
    getArrayField: (arrayField: string) => ArrayFieldRegistration;
    addArrayFieldRow: (arrayField: string, index?: number) => number;
    addArrayFieldRowWithValue: (arrayField: string, rowValue: unknown, index?: number) => { index: number; updateKey: number };
    removeArrayFieldRow: (arrayField: string, index: number) => void;
}
