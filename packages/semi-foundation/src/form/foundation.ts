import { isEqual, isPlainObject } from 'es-toolkit';
import { toPath } from 'es-toolkit/compat';
import scrollIntoViewIfNeeded, { type Options as ScrollIntoViewOptions } from 'scroll-into-view-if-needed';
import BaseFoundation from '../base/foundation';
import isPromise from '../utils/is-promise';
import * as ObjectUtil from '../utils/object';
import warning from '../utils/warning';
import { cssClasses } from './constants';
import { type FieldError, hasErrors, isErrorLeaf, normalizeFieldError, normalizeFormErrors } from './errors';
import type FieldStore from './field-store';
import type { BaseFormAdapter, FormState, CallOpts, FieldRegistration, ComponentProps, setValuesConfig, ArrayFieldRegistration, ValidateOptions, ChangeFieldValueOptions, FieldSnapshot, StandardSchema, StandardSchemaIssue, StandardSchemaResult } from './interface';
import { validateRules } from './rules';
import { isValid, nextUpdateKey, schemaIssuePath } from './utils';

const SILENT: CallOpts = { skipNotify: true, skipRender: true };

const prefix = cssClasses.PREFIX;
const ERROR_SELECTOR = `.${prefix}-field-error-message`;
const errorField = (errorDOM: Element) => errorDOM.closest(`.${prefix}-field, .${prefix}-field-group`);
// The library types standard and custom `behavior` as separate overloads; Form passes the caller's options, either kind, through
const scrollIntoView = scrollIntoViewIfNeeded as (target: Element, options: ScrollIntoViewOptions) => unknown;

export type { BaseFormAdapter } from './interface';

// Falsy, or a plain object holding no error, passes. Error instances and Promises are not plain objects, so a thrown
// Error still fails.
function isFormValidatorPassed(result: unknown) {
    if (!result) {
        return true;
    }
    return isPlainObject(result) && !hasErrors(normalizeFormErrors(result));
}

function isStandardSchema(value: unknown): value is StandardSchema {
    return value !== null && (typeof value === 'object' || typeof value === 'function') && '~standard' in value;
}

function issueMessages(issues: ReadonlyArray<StandardSchemaIssue>, first: boolean) {
    const messages = issues.map((issue) => issue.message);
    return first ? messages.slice(0, 1) : messages;
}

function moveItem<T>(items: T[], from: number, to: number) {
    const moved = items.slice();
    // errors and touched can be shorter than the rows; splice past the end would insert at the end instead of `to`
    moved.length = Math.max(moved.length, from + 1, to + 1);
    const [item] = moved.splice(from, 1);
    moved.splice(to, 0, item);
    return moved;
}

/** Whether `path` is `ancestor` or a path under it, compared by segment: `a[1]` is under `a`, `ab` is not */
function isPathWithin(path: string, ancestor: string) {
    const segments = toPath(path);
    return toPath(ancestor).every((segment, i) => segment === segments[i]);
}

interface SchemaRun {
    result: StandardSchemaResult<unknown>;
    /** By field path: an issue under a field holding the value as a whole belongs to that field */
    fieldErrors: Map<string, FieldError>;
    /** By issue path, parents first: issues no registered field holds, such as those of an unmounted group */
    detachedErrors: Map<string, FieldError>;
}

type ScrollToErrorOpts = {
    field?: string;
    index?: number;
    scrollOpts?: ScrollIntoViewOptions;
};
export default class FormFoundation<E = unknown> extends BaseFoundation<BaseFormAdapter<Record<string, any>, Record<string, any>, any, E>> {
    #data: FormState;
    #batchDepth = 0;
    #pendingFields = new Set<FieldStore>();
    #fields: Map<string, FieldRegistration>;
    #registered: Record<string, boolean>;
    #registeredArrayField: Map<string, ArrayFieldRegistration>;
    // The newest non-silent validation of each field: an older one settles with it instead of writing its own result
    #validations = new Map<string, Promise<unknown>>();
    #debounceTimer?: ReturnType<typeof setTimeout>;
    #debouncedFields = new Set<string>();
    // The Form's own cleanup runs before its fields' (React unmounts a parent's layout effects first)
    #destroyed = false;
    // reset() of the whole Form starts a new epoch: a validation started in an older one settles without writing or
    // reporting
    #epoch = 0;
    // The newest non-silent form-level validation; an older one still settles with its own result but writes nothing
    #formValidation = 0;
    // Set from an unregister until the render after it, which reports the values once
    #unregisterNotifyPending = false;
    // The run the validations requested in this tick share
    #pendingSchemaRun?: Promise<SchemaRun>;
    // The newest run with a non-silent request: only it writes, so an async schema settling out of order shows no older result
    #latestSchemaRun?: Promise<SchemaRun>;
    // Written by the last batch validation, so that the next one reports them to onErrorChange when they clear
    #detachedErrorPaths: string[] = [];

    constructor(adapter: BaseFormAdapter<Record<string, any>, Record<string, any>, any, E>) {
        super(adapter);
        // initValues is read here too: a field set on the Form may have no Field entity,
        // so the initial value cannot rely on the register moment alone
        let { initValues } = this.adapter.getProps();
        initValues = this.adapter.cloneDeep(initValues);

        this.#data = {
            values: initValues ?? {},
            errors: {},
            touched: {},
        };

        this.#fields = new Map();

        this.#registered = {};

        this.#registeredArrayField = new Map();
    }

    #forceUpdate(callback?: () => void) {
        this.adapter.forceUpdate(this.getFormState(), callback);
    }

    #updateField(store: FieldStore, snapshot: Partial<FieldSnapshot>) {
        if (!store.update(snapshot)) {
            return;
        }
        if (this.#batchDepth) {
            this.#pendingFields.add(store);
        } else {
            store.notify();
        }
    }

    #batch(run: () => void) {
        this.#batchDepth += 1;
        try {
            run();
        } finally {
            this.#batchDepth -= 1;
            if (!this.#batchDepth) {
                const pending = [...this.#pendingFields];
                this.#pendingFields.clear();
                pending.forEach((store) => store.notify());
            }
        }
    }

    // Mirrors the failure branches: errors without a Field (the validator may return any key) live only in formState,
    // so they are cleared there too, and formState consumers get a fresh snapshot
    #clearFormErrors() {
        const prevErrors = this.#data.errors;
        this.#data = { ...this.#data, errors: {} };
        this.#injectErrorToField({});
        this.adapter.notifyChange(this.#data);
        this.#notifyErrorChange(prevErrors, this.#fields.keys());
        this.#forceUpdate();
    }

    // A failed form-level validator replaces formState.errors as a whole, keys without a Field included.
    #setFormErrors(formErrors: Record<string, any>) {
        const prevErrors = this.#data.errors;
        this.#data = { ...this.#data, errors: formErrors };
        this.#injectErrorToField(formErrors);
        this.adapter.notifyChange(this.#data);
        this.#notifyErrorChange(prevErrors, this.#fields.keys());
        // the error messages the scroll looks for exist only once this update is rendered
        this.#forceUpdate(() => this.#autoScroll());
    }

    /**
     * Reports the errors a batch operation changed in one onErrorChange: the operation writes each field's error with
     * skipNotify, then compares those fields' errors with the ones before it
     */
    #notifyErrorChange(prevErrors: FormState['errors'], fieldPaths: Iterable<string>) {
        const changedError: Record<string, unknown> = {};
        for (const path of fieldPaths) {
            const error = ObjectUtil.get(this.#data.errors, path);
            if (!isEqual(error, ObjectUtil.get(prevErrors, path))) {
                changedError[path] = error;
            }
        }
        if (Object.keys(changedError).length) {
            this.adapter.notifyErrorChange(this.#data.errors, changedError);
        }
    }

    #isCancelled(epoch: number) {
        return this.#destroyed || epoch !== this.#epoch;
    }

    #cancelError() {
        return new Error(this.#destroyed ? '[Semi Form] the Form unmounted before the validation settled' : '[Semi Form] the Form was reset before the validation settled');
    }

    // Resolves with the values at settle time, not a snapshot from the call, so edits made during an async validation
    // are included
    #formValidate(silent: boolean = false) {
        const { validator } = this.getProps();
        const epoch = this.#epoch;
        const validation = silent ? undefined : ++this.#formValidation;
        const writes = () => validation === this.#formValidation;

        return new Promise((resolve, reject) => {
            const pass = () => {
                resolve(this.adapter.cloneDeep(this.#data.values));
                if (writes()) {
                    this.#clearFormErrors();
                }
            };
            const fail = (errors: unknown) => {
                // Only an object maps errors to paths: another result (a string) still reaches the caller through the
                // rejection, but writing it would make later field errors spread its characters into keys.
                const formErrors = isPlainObject(errors) ? normalizeFormErrors(errors) : undefined;
                if (writes()) {
                    this.#setFormErrors(formErrors ?? {});
                }
                reject(formErrors ?? errors);
            };
            let maybePromisedErrors;
            try {
                maybePromisedErrors = validator(this.#data.values);
            } catch (errors) {
                maybePromisedErrors = errors;
            }
            if (isFormValidatorPassed(maybePromisedErrors)) {
                pass();
            } else if (isPromise(maybePromisedErrors)) {
                maybePromisedErrors.then(
                    (result: unknown) => {
                        if (this.#isCancelled(epoch)) {
                            reject(this.#cancelError());
                        } else if (isFormValidatorPassed(result)) {
                            pass();
                        } else {
                            fail(result);
                        }
                    },
                    (errors: unknown) => {
                        if (this.#isCancelled(epoch)) {
                            reject(this.#cancelError());
                            return;
                        }
                        if (writes()) {
                            this.#autoScroll();
                        }
                        reject(errors);
                    }
                );
            } else {
                fail(maybePromisedErrors);
            }
        });
    }

    /** The one check of the exclusive validation sources: a Form `validator` hides the schema, a schema hides field-level validation */
    #getSchema(): StandardSchema | undefined {
        const { schema, validator } = this.getProps();
        return typeof validator === 'function' ? undefined : schema;
    }

    #mapSchemaIssues(issues: ReadonlyArray<StandardSchemaIssue>) {
        const pathKey = (segments: string[]) => segments.join('\0');
        const fields = new Map([...this.#fields.values()].map((registration) => [pathKey(toPath(registration.field)), registration]));
        const targets = new Map<string, { registration?: FieldRegistration; messages: string[] }>();
        const located = issues.map((issue) => {
            const path = schemaIssuePath(issue);
            return { message: issue.message, path, segments: toPath(path) };
        });
        // A child's error replaces its parent's where both exist: one position of the error tree holds one of them
        located
            .toSorted((a, b) => a.segments.length - b.segments.length)
            .forEach(({ message, path, segments }) => {
                let registration: FieldRegistration | undefined;
                for (let i = segments.length; i > 0 && !registration; i--) {
                    registration = fields.get(pathKey(segments.slice(0, i)));
                }
                const target = registration?.field ?? path;
                const entry = targets.get(target) ?? { registration, messages: [] };
                entry.messages.push(message);
                targets.set(target, entry);
            });
        const fieldErrors = new Map<string, FieldError>();
        const detachedErrors = new Map<string, FieldError>();
        targets.forEach(({ registration, messages }, target) => {
            const { stopValidateWithError } = registration ? registration.getValidateOptions() : this.getProps();
            (registration ? fieldErrors : detachedErrors).set(target, stopValidateWithError ? messages.slice(0, 1) : messages);
        });
        return { fieldErrors, detachedErrors };
    }

    /**
     * Validations requested in one tick share a run: the fields of a batch validation, or those mounting together with
     * trigger="mount", must not call an async schema once each. It reads the values when it starts.
     */
    #requestSchemaRun(schema: StandardSchema, silent: boolean) {
        this.#pendingSchemaRun ??= Promise.resolve().then(async () => {
            this.#pendingSchemaRun = undefined;
            const result = await schema['~standard'].validate(this.#data.values);
            return { result, ...this.#mapSchemaIssues(result.issues ?? []) };
        });
        if (!silent) {
            this.#latestSchemaRun = this.#pendingSchemaRun;
        }
        return this.#pendingSchemaRun;
    }

    #validateSchema(registration: FieldRegistration, schema: StandardSchema, opts: CallOpts) {
        const epoch = this.#epoch;
        const silent = Boolean(opts.silent);
        const run = this.#requestSchemaRun(schema, silent);
        const validation = new Promise((resolve, reject) => {
            run.then((schemaRun) => {
                if (this.#isSuperseded(registration, validation, epoch, silent, resolve)) {
                    return;
                }
                if (!silent && run !== this.#latestSchemaRun) {
                    resolve(this.#latestSchemaRun.then(({ fieldErrors }) => fieldErrors.get(registration.field)));
                    return;
                }
                const error = schemaRun.fieldErrors.get(registration.field);
                this.#setFieldError(registration, error, { ...opts, status: error === undefined ? 'success' : 'error' });
                // a batch validation writes every field and reports them together
                if (!opts.skipNotify) {
                    this.#refreshTouchedFields(schemaRun, registration);
                }
                resolve(error);
            }, reject);
        });
        if (!silent) {
            this.#validations.set(registration.field, validation);
        }
        return validation;
    }

    /** One field's value can fail another (a refine on two fields), so the fields the user already left follow the run */
    #refreshTouchedFields({ fieldErrors }: SchemaRun, changed: FieldRegistration) {
        const prevErrors = this.#data.errors;
        const refreshed: string[] = [];
        this.#batch(() => {
            this.#fields.forEach((registration) => {
                const { touched, error: prevError } = registration.store.getSnapshot();
                const error = fieldErrors.get(registration.field);
                if (registration !== changed && touched && !isEqual(error, prevError)) {
                    this.#setFieldError(registration, error, { ...SILENT, status: error === undefined ? 'success' : 'error' });
                    refreshed.push(registration.field);
                }
            });
        });
        if (refreshed.length) {
            this.adapter.notifyChange(this.#data);
            this.#notifyErrorChange(prevErrors, refreshed);
            this.#forceUpdate();
        }
    }

    /**
     * Writes the issues no field holds. Validating everything replaces the errors as a whole, so an error kept for an
     * unmounted field cannot outlive the run; validating some paths only touches those without a field under them.
     */
    #writeDetachedErrors(detached: Array<[string, unknown]>, fieldPaths: Array<string> | undefined, validatedPaths: Array<string>) {
        const current = this.#data.errors;
        let errors = fieldPaths ? current : {};
        fieldPaths?.forEach((path) => {
            if (!this.#getNestedField(path).size) {
                errors = ObjectUtil.remove(errors, path);
            }
        });
        detached.forEach(([path, error]) => {
            errors = ObjectUtil.set(errors, path, error);
        });
        if (!fieldPaths) {
            validatedPaths.forEach((path) => {
                const error = ObjectUtil.get(current, path);
                if (error !== undefined) {
                    errors = ObjectUtil.set(errors, path, error);
                }
            });
        }
        this.#data = { ...this.#data, errors };
    }

    #fieldsValidate(fieldPaths?: Array<string>, silent: boolean = false) {
        return new Promise((resolve, reject) => {
            let promiseSet: Promise<any>[] = [];
            const targetFields = this.#getOperateFieldMap(fieldPaths);
            // Fields may register, unregister or be renamed before the results settle; the results follow these paths
            const paths = [...targetFields.keys()];
            const epoch = this.#epoch;
            const prevErrors = this.#data.errors;
            const schema = this.#getSchema();
            const schemaRun = schema && this.#requestSchemaRun(schema, silent);
            targetFields.forEach((field, fieldPath) => {
                const fieldValue = this.#getValue(fieldPath);
                // Fields publish independently; the form snapshot and callbacks wait for every validation.
                const opts: CallOpts = {
                    skipNotify: true,
                    skipRender: true,
                    silent,
                };
                const validateResult = this.#validateField(field, fieldValue, opts);
                promiseSet.push(validateResult);
                if (!silent) {
                    this.#setFieldTouched(field, true, { skipNotify: true, skipRender: true });
                }
            });
            void Promise.all([schemaRun, Promise.all(promiseSet)]).then(([settledRun, results]) => {
                if (this.#isCancelled(epoch)) {
                    reject(this.#cancelError());
                    return;
                }
                const detached = [...(settledRun?.detachedErrors ?? [])].filter(([path]) => !fieldPaths || fieldPaths.some((target) => isPathWithin(path, target)));
                if (settledRun && !silent) {
                    this.#writeDetachedErrors(detached, fieldPaths, paths);
                }
                // A validated field fails on any error value but undefined, [''] included: a rule with `message: ''`
                // fails without a text. A field with nothing to validate (null result) keeps the error set on it.
                let errors = this.#getError();
                let valid = !detached.length && paths.every((path, i) => (results[i] === null ? isValid(ObjectUtil.get(errors, path)) : results[i] === undefined));
                if (silent) {
                    // A silent validation writes nothing to formState, so its errors come from the settled results,
                    // which are each field's error value (undefined when valid, null without validation)
                    errors = {};
                    detached.forEach(([path, error]) => {
                        errors = ObjectUtil.set(errors, path, error);
                    });
                    paths.forEach((fieldPath, i) => {
                        if (results[i] != null) {
                            errors = ObjectUtil.set(errors, fieldPath, results[i]);
                        }
                    });
                    valid = ObjectUtil.isEmpty(errors);
                }
                if (!silent) {
                    const detachedPaths = detached.map(([path]) => path);
                    this.adapter.notifyChange(this.#data);
                    this.#notifyErrorChange(prevErrors, [...paths, ...detachedPaths, ...this.#detachedErrorPaths]);
                    this.#detachedErrorPaths = detachedPaths;
                    this.#forceUpdate(valid ? undefined : () => this.#autoScroll());
                }
                if (valid) {
                    // Only a run of the whole form has an output; validating some paths passes on the values as they are
                    const output = !fieldPaths && settledRun && !settledRun.result.issues ? settledRun.result.value : this.#data.values;
                    resolve(this.adapter.cloneDeep(output));
                } else {
                    reject(errors);
                }
            }, reject);
        });
    }

    #getNestedField(path: string): Map<string, FieldRegistration> {
        const allRegisterField = this.#fields;
        const allFieldPath = [...allRegisterField].map((item) => item[0]);
        let nestedFieldPath = new Map();
        allFieldPath.forEach((item) => {
            let itemPath = toPath(item);
            let targetPath = toPath(path);
            if (targetPath.every((_path, i) => targetPath[i] === itemPath[i])) {
                const realField = allRegisterField.get(item);
                nestedFieldPath.set(item, realField);
            }
        });
        return nestedFieldPath;
    }

    #getOperateFieldMap(fieldPaths?: Array<string>): Map<string, FieldRegistration> {
        let targetFields = new Map();
        if (fieldPaths !== undefined) {
            fieldPaths.forEach((path) => {
                const field = this.#fields.get(path);
                // may be undefined, if exists two fields like 'a[0]'、'a[1]', but user directly call reset(['a']) / validate(['a'])
                if (field === undefined) {
                    const nestedFields = this.#getNestedField(path);
                    targetFields = new Map([...targetFields, ...nestedFields]);
                } else {
                    targetFields.set(path, field);
                }
            });
        } else {
            targetFields = this.#fields;
        }
        return targetFields;
    }

    /**
     * An ArrayField has no single Field entity: restore its value in formState from the initial value, and renew its
     * updateKey so it renders again. reset(fields) restores only the ArrayFields at or under one of the paths.
     */
    #resetArrayField(fieldPaths?: Array<string>) {
        const arrayFieldPaths = [...this.#registeredArrayField.keys()].filter((path) => fieldPaths === undefined || fieldPaths.some((target) => isPathWithin(path, target)));
        arrayFieldPaths.forEach((path) => {
            const arrayFieldState = this.#registeredArrayField.get(path);
            // a copy: onChange and onValueChange hand out the live values, and a consumer mutating them must not change
            // the saved init value
            const arrayFieldInitValue = this.adapter.cloneDeep(arrayFieldState.initValue);
            this.#updateStateValue(path, arrayFieldInitValue, { skipNotify: true, skipRender: true });
            this.#updateArrayField(path, { updateKey: nextUpdateKey() });
        });
        // Rows that stay mounted keep their field and its store, which a removed row's rename left on another row's
        // value: they take the restored values
        this.#batch(() => {
            this.#fields.forEach((registration) => {
                if (arrayFieldPaths.some((path) => isPathWithin(registration.field, path))) {
                    this.#updateField(registration.store, { value: ObjectUtil.get(this.#data.values, registration.field) });
                }
            });
        });
    }

    #autoScroll() {
        const { autoScrollToError } = this.getFormProps();
        if (!autoScrollToError) {
            return;
        }
        const scrollOpts: ScrollIntoViewOptions = typeof autoScrollToError === 'object' ? autoScrollToError : { behavior: 'smooth', block: 'start' };
        const [fieldDOM] = this.#getErrorFieldDOMs();
        if (fieldDOM) {
            scrollIntoView(fieldDOM, scrollOpts);
        }
    }

    #getField = (field: string) => this.#fields.get(field);

    /**
     * Settles an outdated validation without writing its result. It follows the newest one, as the Form waits on every
     * field's promise and one that never settles would hang validate() and submit (a promise must not resolve with
     * itself, hence the identity check). A silent validation is never the newest one: it writes nothing, so it must
     * not keep a normal one from writing. One started before a reset of the whole Form or of its field, before
     * setValue or setValues wrote its field, or whose field component has unmounted since, settles with undefined.
     */
    #isSuperseded(registration: FieldRegistration, validation: Promise<unknown>, epoch: number, silent: boolean, resolve: (value: unknown) => void) {
        if (epoch !== this.#epoch) {
            resolve(undefined);
            return true;
        }
        const latest = this.#validations.get(registration.field);
        if (!silent && latest !== validation) {
            resolve(latest);
            return true;
        }
        if (this.#fields.get(registration.field)?.id !== registration.id) {
            resolve(undefined);
            return true;
        }
        return false;
    }

    /** Resolves with the field's errors, undefined when valid; a rule that throws (a bad transform) rejects */
    #validateRules(registration: FieldRegistration, value: unknown, opts: CallOpts) {
        const { field } = registration;
        const { rules, stopValidateWithError } = registration.getValidateOptions();
        const epoch = this.#epoch;
        const silent = Boolean(opts.silent);
        const validation = new Promise((resolve, reject) => {
            validateRules(rules, value, this.#getValue(), { messages: this.adapter.getLocale(), first: stopValidateWithError }).then((error) => {
                if (this.#isSuperseded(registration, validation, epoch, silent, resolve)) {
                    return;
                }
                // [''] fails without a text, so the result decides the status, not whether it has messages
                this.#setFieldError(registration, error, { ...opts, status: error ? 'error' : 'success' });
                resolve(error);
            }, reject);
        });
        if (!silent) {
            this.#validations.set(field, validation);
        }
        return validation;
    }

    #runFieldValidator(registration: FieldRegistration, value: unknown) {
        const { validate, stopValidateWithError } = registration.getValidateOptions();
        if (isStandardSchema(validate)) {
            const toError = (result: StandardSchemaResult<unknown>) => (result.issues ? issueMessages(result.issues, Boolean(stopValidateWithError)) : undefined);
            const result = validate['~standard'].validate(value);
            return isPromise(result) ? result.then(toError) : toError(result);
        }
        return validate(value, this.#getValue());
    }

    #validateCustom(registration: FieldRegistration, value: unknown, opts: CallOpts) {
        const epoch = this.#epoch;
        const silent = Boolean(opts.silent);
        const validation = new Promise((resolve) => {
            let maybePromisedErrors;
            try {
                maybePromisedErrors = this.#runFieldValidator(registration, value);
            } catch (err) {
                maybePromisedErrors = err;
            }
            const settle = (result: unknown) => {
                const error = normalizeFieldError(result);
                this.#setFieldError(registration, error, opts);
                resolve(error);
            };
            if (isPromise(maybePromisedErrors)) {
                // a rejection is the field's error, like a sync throw
                const settleLatest = (result: unknown) => {
                    if (!this.#isSuperseded(registration, validation, epoch, silent, resolve)) {
                        settle(result);
                    }
                };
                maybePromisedErrors.then(settleLatest, settleLatest);
            } else {
                settle(maybePromisedErrors);
            }
        });
        if (!silent) {
            this.#validations.set(registration.field, validation);
        }
        return validation;
    }

    /**
     * The field passes its own registration: a wrapped component may report a change from its mount effect, which runs
     * before the field registers. The Form's `schema` excludes field-level validation; without it `validate` wins over
     * `rules` (the two are exclusive, #register warns), and a field with neither has nothing to validate.
     */
    #validateField = (registration: FieldRegistration, value: unknown, opts: CallOpts = {}): Promise<unknown> | null => {
        const schema = this.#getSchema();
        if (schema) {
            return this.#validateSchema(registration, schema, opts);
        }
        const { rules, validate, transform } = registration.getValidateOptions();
        const finalValue = transform ? transform(value) : value;
        if (validate) {
            return this.#validateCustom(registration, finalValue, opts);
        }
        return rules ? this.#validateRules(registration, finalValue, opts) : null;
    };

    /**
     * Commits a value the user entered. onChange must already see it through the form api, yet a throwing onChange
     * must leave the form state untouched: the value is written silently first and committed with notify and update
     * once onChange returns; a throw rolls it back and propagates.
     */
    #changeFieldValue = (registration: FieldRegistration, value: unknown, opts: ChangeFieldValueOptions) => {
        const { field, valuePath } = registration;
        const { allowEmptyString, emptyValue, convert } = registration.getChangeOptions();
        const { allowEmpty } = opts;
        let nextValue = valuePath ? ObjectUtil.get(value, valuePath) : value;
        if (typeof convert === 'function') {
            nextValue = convert(nextValue);
        }
        if (!allowEmptyString && !allowEmpty && nextValue === emptyValue) {
            nextValue = undefined;
        }
        this.#batch(() => {
            const prevValue = this.#getValue(field, { needClone: true });
            try {
                this.#setFieldValue(registration, nextValue, SILENT);
                opts.onChange(this.#getValue());
                // touched is set after onChange, which must not see it yet
                this.#setFieldTouched(registration, true, SILENT);
                this.#updateStateValue(field, nextValue, { allowEmpty });
                if (opts.validate) {
                    this.#validateOnChange(registration, nextValue);
                }
            } catch (err) {
                this.#setFieldValue(registration, prevValue, SILENT);
                throw err;
            }
        });
    };

    /**
     * With `schemaDebounce`, change validations against the schema wait until the user pauses: each run validates the
     * whole form. No promise exists until the timer fires, so nothing waits on a cancelled one.
     */
    #validateOnChange(registration: FieldRegistration, value: unknown) {
        const { schemaDebounce } = this.getProps();
        if (!(schemaDebounce > 0) || !this.#getSchema()) {
            void this.#validateField(registration, value);
            return;
        }
        this.#debouncedFields.add(registration.field);
        clearTimeout(this.#debounceTimer);
        this.#debounceTimer = setTimeout(() => {
            const fields = [...this.#debouncedFields];
            this.#cancelDebouncedValidation();
            fields.forEach((field) => {
                const current = this.#fields.get(field);
                if (current) {
                    void this.#validateField(current, this.#getValue(field));
                }
            });
        }, schemaDebounce);
    }

    #cancelDebouncedValidation() {
        clearTimeout(this.#debounceTimer);
        this.#debounceTimer = undefined;
        this.#debouncedFields.clear();
    }

    // The field's store carries its state across re-registration (rename, ArrayField row removal, Activity).
    #register = (field: string, registration: FieldRegistration) => {
        const fieldState = registration.store.getSnapshot();
        const registered = this.#registered[field];
        this.#registered[field] = true;
        const { rules, validate } = registration.getValidateOptions();
        warning(!registered && Boolean(this.#getSchema()) && Boolean(rules || validate), `[Semi Form] <Form schema> excludes field-level validation; the rules and validator of field "${field}" will be ignored`);
        warning(!registered && Boolean(rules && validate), `[Semi Form] the rules and validator of field "${field}" are exclusive; validator is used`);
        this.#fields.set(field, registration);
        const allowEmpty = registration.allowEmpty ?? false;
        const opts: CallOpts = {
            skipNotify: true,
            skipRender: false,
            allowEmpty,
        };
        let fieldValue = fieldState.value;
        // Without allowEmpty an empty string counts as undefined, so the field's key stays out of values
        if (!allowEmpty && fieldValue === '') {
            fieldValue = undefined;
        }

        if (!(registration.keepState && registered && !registration.inArrayField)) {
            this.#updateStateValue(field, fieldValue, opts);
            if (fieldState.error) {
                this.#updateStateError(field, fieldState.error, opts);
            } else if (!registered || registration.keepState) {
                // A validation may have written this path before its field first mounted, or a kept ArrayField left it
                // for its remounting rows. Under a leaf a path reads single messages, so an error on the parent (an
                // array's minimum length) is not this field's.
                const parentError = ObjectUtil.get(this.#data.errors, toPath(field).slice(0, -1));
                const error = isErrorLeaf(parentError) ? undefined : ObjectUtil.get(this.#data.errors, field);
                if (isErrorLeaf(error)) {
                    this.#setFieldError(registration, error, { ...opts, skipRender: true });
                }
            }
            // a renamed row field carries its touched to the new path, as the rows' paths moved under it
            if (fieldState.touched) {
                this.#updateStateTouched(field, fieldState.touched, opts);
            } else if (registration.keepState && ObjectUtil.get(this.#data.touched, field) === true) {
                this.#setFieldTouched(registration, true, { ...opts, skipRender: true });
            }
            return;
        }

        // A remounting keepState field restores its saved state from formState instead of the initial value
        if (ObjectUtil.has(this.#data.values, field)) {
            const savedValue = ObjectUtil.get(this.#data.values, field);
            // formState stays the source of truth; the forceUpdate gives its consumers a fresh snapshot
            this.#updateStateValue(field, savedValue, opts);
            // Sync the field snapshot without a second form update or callback.
            this.#setFieldValue(registration, savedValue, { ...opts, skipRender: true });
        } else {
            this.#updateStateValue(field, fieldValue, opts);
        }

        if (ObjectUtil.has(this.#data.errors, field)) {
            const savedError = ObjectUtil.get(this.#data.errors, field);
            this.#updateStateError(field, savedError, opts);
            this.#setFieldError(registration, savedError, { ...opts, skipRender: true });
        }

        if (ObjectUtil.has(this.#data.touched, field)) {
            const savedTouched = ObjectUtil.get(this.#data.touched, field);
            this.#updateStateTouched(field, savedTouched, opts);
            this.#setFieldTouched(registration, savedTouched, { ...opts, skipRender: true });
        }
    };

    #unRegister = (field: string) => {
        if (!this.#fields.get(field).keepState) {
            this.#data = {
                values: ObjectUtil.remove(this.#data.values, field),
                errors: ObjectUtil.remove(this.#data.errors, field),
                touched: ObjectUtil.remove(this.#data.touched, field),
            };
        }
        this.#fields.delete(field);
        // Unmounting the whole Form unregisters every field; reporting each one would call onChange once per field
        // and write a non-empty snapshot back to a useForm api that was already unbound
        if (this.#destroyed) {
            return;
        }
        // A renamed field (a shifted ArrayField row) unregisters its old path and registers the new one in the same
        // commit, after the other rows unregistered theirs: reporting here would hand onChange values with rows
        // missing. The render after the commit reports the values once.
        if (this.#unregisterNotifyPending) {
            this.#forceUpdate();
            return;
        }
        this.#unregisterNotifyPending = true;
        this.#forceUpdate(() => {
            this.#unregisterNotifyPending = false;
            this.adapter.notifyChange(this.#data);
        });
    };

    #registerArrayField = (arrayFieldPath: string, val: any) => {
        this.#updateArrayField(arrayFieldPath, {
            updateKey: nextUpdateKey(),
            initValue: val,
        });
    };

    /**
     * Registers a mounting ArrayField and writes its initial value. Its rows register first (React runs a child's
     * layout effects before its parent's) and have written their own values already, so the values of the fields and
     * ArrayFields registered under it are laid over the array again, outer paths first.
     */
    #mountArrayField = (arrayFieldPath: string, val: any) => {
        const target = toPath(arrayFieldPath);
        const isNested = (path: string) => {
            const nested = toPath(path);
            return nested.length > target.length && target.every((key, i) => key === nested[i]);
        };
        const nestedArrayFields = [...this.#registeredArrayField.keys()]
            .filter(isNested)
            .toSorted((a, b) => toPath(a).length - toPath(b).length)
            .map((path) => ({ path, allowEmpty: false }));
        const nestedFields = [...this.#fields.values()].filter((registration) => isNested(registration.field)).map((registration) => ({ path: registration.field, allowEmpty: registration.allowEmpty }));
        const nestedValues = [...nestedArrayFields, ...nestedFields].map((item) => ({
            ...item,
            value: this.#getValue(item.path),
        }));
        // An ArrayField that unmounted with keepState left its registration: reset() still restores the first initValue
        const kept = this.#registeredArrayField.get(arrayFieldPath);

        if (kept) {
            this.#updateArrayField(arrayFieldPath, { updateKey: nextUpdateKey() });
        } else {
            this.#registerArrayField(arrayFieldPath, val);
        }
        this.#updateStateValue(arrayFieldPath, this.adapter.cloneDeep(val), SILENT);
        nestedValues.forEach(({ path, allowEmpty, value }) => {
            this.#updateStateValue(path, value, { ...SILENT, allowEmpty });
        });
        if (!kept) {
            // reset() restores what the rows show now, their own initValue included
            this.#updateArrayField(arrayFieldPath, { initValue: this.adapter.cloneDeep(this.#getValue(arrayFieldPath)) });
        }
        this.#forceUpdate();
    };

    /**
     * Applies one row edit to the ArrayField's values, and to its errors and touched where they hold rows: an error
     * leaf at the array path (a schema's minItems) belongs to the array itself and stays.
     */
    #editRows(arrayFieldPath: string, edit: <T>(rows: T[]) => T[], valueOpts: CallOpts) {
        const errors = this.#getError(arrayFieldPath);
        if (Array.isArray(errors) && !isErrorLeaf(errors)) {
            this.#updateStateError(arrayFieldPath, edit(errors), SILENT);
        }
        const touched = this.#getTouched(arrayFieldPath);
        if (Array.isArray(touched)) {
            this.#updateStateTouched(arrayFieldPath, edit(touched) as any, SILENT);
        }
        const values = this.#getValue(arrayFieldPath);
        if (Array.isArray(values)) {
            this.#updateStateValue(arrayFieldPath, edit(values), valueOpts);
        }
    }

    /** Inserts an empty row before `index`, or appends one without it; returns the ArrayField's new updateKey */
    #addArrayFieldRow = (arrayFieldPath: string, index?: number) => {
        if (typeof index === 'number') {
            this.#editRows(arrayFieldPath, (rows) => rows.toSpliced(index, 0, undefined), SILENT);
        }
        const updateKey = nextUpdateKey();
        this.#updateArrayField(arrayFieldPath, { updateKey });
        this.#forceUpdate();
        return updateKey;
    };

    #addArrayFieldRowWithValue = (arrayFieldPath: string, rowValue: unknown, index?: number) => {
        const values = this.#getValue(arrayFieldPath);
        const rows = values ? values.slice() : [];
        const rowIndex = typeof index === 'number' ? Math.max(0, Math.min(index, rows.length)) : rows.length;
        rows.splice(rowIndex, 0, this.adapter.cloneDeep(rowValue));
        const updateKey = nextUpdateKey();
        this.#updateArrayField(arrayFieldPath, { updateKey });
        this.#updateStateValue(arrayFieldPath, rows, {});
        return { index: rowIndex, updateKey };
    };

    /** Every key of the row is removed too: some keys are set only in initValue and never taken over by a field */
    #removeArrayFieldRow = (arrayFieldPath: string, index: number) => {
        this.#editRows(arrayFieldPath, (rows) => rows.toSpliced(index, 1), {});
    };

    #moveArrayFieldRow = (arrayFieldPath: string, from: number, to: number) => {
        this.#editRows(arrayFieldPath, (rows) => moveItem(rows, from, to), {});
        const updateKey = nextUpdateKey();
        this.#updateArrayField(arrayFieldPath, { updateKey });
        return updateKey;
    };

    #unRegisterArrayField = (arrayField: string, keepState: boolean) => {
        if (keepState) {
            return;
        }
        this.#registeredArrayField.delete(arrayField);
        this.#data = {
            values: ObjectUtil.remove(this.#data.values, arrayField),
            errors: ObjectUtil.remove(this.#data.errors, arrayField),
            touched: ObjectUtil.remove(this.#data.touched, arrayField),
        };
    };

    #getArrayField = (arrayField: string) => this.#registeredArrayField.get(arrayField);

    #updateArrayField(arrayField: string, updateValue: any) {
        const mergeVal = { ...this.#registeredArrayField.get(arrayField), ...updateValue };
        this.#registeredArrayField.set(arrayField, mergeVal);
    }

    #validate(fieldPaths?: Array<string> | ValidateOptions) {
        const { validator } = this.getProps();

        let fields: Array<string> | undefined;
        let silent = false;

        if (fieldPaths && !Array.isArray(fieldPaths)) {
            const options = fieldPaths;
            fields = options.fields as Array<string> | undefined;
            silent = options.silent ?? false;
        } else {
            fields = fieldPaths as Array<string> | undefined;
        }

        if (typeof validator === 'function') {
            return this.#formValidate(silent);
        } else {
            return this.#fieldsValidate(fields, silent);
        }
    }

    #injectErrorToField(errors: any) {
        this.#fields.forEach((field) => {
            const fieldError = ObjectUtil.get(errors, field.field);
            const opts = {
                skipNotify: true,
                skipRender: true,
            };
            this.#setFieldError(field, fieldError, opts);
        });
    }

    #getValue = (field?: string, opts?: CallOpts) => {
        const value = typeof field === 'undefined' ? { ...this.#data.values } : ObjectUtil.get(this.#data.values, field);
        return opts?.needClone ? this.adapter.cloneDeep(value) : value;
    };

    #setValues(values: any, { isOverride = false }) {
        const _values = this.adapter.cloneDeep(values);
        this.#fields.forEach((field) => {
            const value = ObjectUtil.get(_values, field.field);
            // onValueChange and onChange fire once for the whole setValues call, not per field
            const opts = {
                skipNotify: true,
                skipRender: true,
            };
            this.#validations.delete(field.field);
            this.#setFieldValue(field, value, opts);
        });

        if (this.#registeredArrayField.size) {
            const arrayFieldPaths = [...this.#registeredArrayField.keys()];
            arrayFieldPaths.forEach((path) => {
                this.#updateArrayField(path, { updateKey: nextUpdateKey() });
            });
        }
        // The values may hold keys without a registered Field; override takes them into formState as they are
        if (isOverride) {
            this.#data = { ...this.#data, values: _values };
        }

        this.adapter.notifyChange(this.#data);
        this.adapter.notifyValueChange(this.#data.values, { ...values });
        this.#forceUpdate();
    }

    #updateStateValue = (field: string, value: any, opts: CallOpts, callback?: () => void) => {
        const skipNotify = opts?.skipNotify;
        const skipRender = opts?.skipRender;

        const allowEmpty = opts?.allowEmpty || this.getProp('allowEmpty');

        this.#data = { ...this.#data, values: ObjectUtil.set(this.#data.values, field, value, allowEmpty) };
        // Registering syncs a Field's initValue into FormState without notify, but still needs a forceUpdate:
        // otherwise the first render of useFormState and useFieldState is wrong
        if (!skipNotify) {
            this.adapter.notifyChange(this.#data);
            this.adapter.notifyValueChange(this.#data.values, { [field]: value });
        }

        if (!skipRender) {
            this.#forceUpdate(callback);
        }
    };

    #getTouched = (field?: string): boolean | Record<string, any> | undefined => {
        if (typeof field === 'undefined') {
            return this.#data.touched;
        }
        return ObjectUtil.get(this.#data.touched, field);
    };

    #updateStateTouched = (field: string, isTouched: boolean, opts?: CallOpts, callback?: () => void) => {
        const skipNotify = opts?.skipNotify;
        const skipRender = opts?.skipRender;
        this.#data = { ...this.#data, touched: ObjectUtil.set(this.#data.touched, field, isTouched) };

        if (!skipNotify) {
            this.adapter.notifyChange(this.#data);
        }
        if (!skipRender) {
            this.#forceUpdate(callback);
        }
    };

    #getError = (field?: string) => {
        if (typeof field === 'undefined') {
            return this.#data.errors;
        }
        return ObjectUtil.get(this.#data.errors, field);
    };

    #updateStateError = (field: string, error: any, opts: CallOpts, callback?: () => void) => {
        const skipNotify = opts?.skipNotify;
        const skipRender = opts?.skipRender;
        this.#data = { ...this.#data, errors: ObjectUtil.set(this.#data.errors, field, error) };

        // Batch operations skip notify here and report once when done; they would otherwise fire once per field
        if (!skipNotify) {
            this.adapter.notifyChange(this.#data);
            this.adapter.notifyErrorChange(this.#data.errors, { [field]: error });
        }

        if (!skipRender) {
            this.#forceUpdate(callback);
        }
    };

    #setFieldError = ({ store, field }: FieldRegistration, error: any, opts?: CallOpts) => {
        // Silent validation only returns a result; publishing it would desynchronize the field and form snapshots.
        if (opts?.silent) {
            return;
        }
        this.#batch(() => {
            if (opts?.status) {
                this.#updateField(store, { status: opts.status });
            }
            // Every validation returns a new array, so equal messages compare by value
            if (isEqual(error, store.getSnapshot().error)) {
                return;
            }
            this.#updateField(store, { error, status: opts?.status ?? (isValid(error) ? 'success' : 'error') });
            this.#updateStateError(field, error, opts);
        });
    };

    #setFieldValue(registration: FieldRegistration, value: any, opts?: CallOpts) {
        this.#batch(() => {
            this.#updateField(registration.store, { value });
            this.#updateStateValue(registration.field, value, {
                ...opts,
                allowEmpty: registration.getChangeOptions().allowEmpty,
            });
        });
    }

    #setFieldTouched = (registration: FieldRegistration, touched: boolean, opts?: CallOpts) => {
        this.#batch(() => {
            this.#updateField(registration.store, { touched });
            this.#updateStateTouched(registration.field, touched, opts);
        });
    };

    /**
     * formApi.setValue / setError / setTouched. A path with a Field updates its snapshot. A path without
     * one, such as an ArrayField's value as a whole (each element has a Field), is written to formState first, then the
     * Fields nested under it take their part: setValue('peoples', [2, 3]) with an Input Field per element.
     */
    #setByPath(kind: 'values' | 'errors' | 'touched', field: string, value: any, opts: CallOpts) {
        const setter = {
            values: (registration: FieldRegistration, value: any, options: CallOpts) => this.#setFieldValue(registration, value, options),
            errors: this.#setFieldError,
            touched: this.#setFieldTouched,
        }[kind];
        const updateState = {
            values: this.#updateStateValue,
            errors: this.#updateStateError,
            touched: this.#updateStateTouched,
        }[kind];
        const registration = this.#fields.get(field);
        if (registration) {
            setter(registration, value, opts);
            return;
        }
        updateState(field, value, opts, () => {
            // Nested controls receive their values only after the parent-path form snapshot has committed.
            this.#getNestedField(field).forEach((nested) => {
                const nestedValue = ObjectUtil.get(this.#data[kind], nested.field);
                setter(nested, nestedValue, { skipNotify: true, skipRender: true });
            });
        });
        if (this.#getArrayField(field)) {
            this.#updateArrayField(field, { updateKey: nextUpdateKey() });
        }
    }

    #getFieldSetterApi() {
        // values and errors are cloned so the caller's object is not shared with form state
        return {
            setValue: (field: string, value: any, opts?: CallOpts) => {
                this.#getOperateFieldMap([field]).forEach((_, path) => this.#validations.delete(path));
                this.#setByPath('values', field, this.adapter.cloneDeep(value), opts);
            },
            setError: (field: string, error: unknown, opts?: CallOpts) => {
                // a field holds one leaf; a path without a field may take the nested errors of the fields under it
                const nested = !this.#fields.has(field) && (isPlainObject(error) || (Array.isArray(error) && error.length > 0 && !isErrorLeaf(error)));
                const tree = nested ? normalizeFormErrors(error) : undefined;
                const normalized = nested ? (hasErrors(tree) ? tree : undefined) : normalizeFieldError(error);
                this.#setByPath('errors', field, normalized, opts);
            },
            setTouched: (field: string, isTouched: boolean | Record<string, any>, opts?: CallOpts) => this.#setByPath('touched', field, isTouched, opts),
        };
    }

    #getFieldExist(field: string) {
        return Boolean(this.#fields.has(field));
    }

    // Queried from the form element rather than document, so a Form inside a ShadowRoot finds its fields (F13)
    #getFieldDOM(field: string) {
        return this.adapter.getFormElement()?.querySelector(`.${prefix}-field[x-field-id="${CSS.escape(field)}"]`) ?? null;
    }

    /** The root elements of the fields showing an error message, in document order */
    #getErrorFieldDOMs() {
        const errorDOMs = this.adapter.getFormElement()?.querySelectorAll(ERROR_SELECTOR) ?? [];
        // a standalone ErrorMessage has no field to scroll to
        return Array.from(errorDOMs, errorField).filter((fieldDOM) => fieldDOM !== null);
    }

    #getErrorFieldDOM(field: string) {
        const errorDOM = this.#getFieldDOM(field)?.querySelector(ERROR_SELECTOR);
        return errorDOM && errorField(errorDOM);
    }

    #scrollToField(field: string, scrollOpts: ScrollIntoViewOptions = { behavior: 'smooth', block: 'start' }) {
        // a pure field or one inside Form.InputGroup has no field root
        const fieldDOM = this.#getFieldExist(field) ? this.#getFieldDOM(field) : null;
        if (fieldDOM) {
            scrollIntoView(fieldDOM, scrollOpts);
        }
    }

    #scrollToError(config?: ScrollToErrorOpts) {
        const { field, index, scrollOpts = { behavior: 'smooth', block: 'start' } } = config ?? {};
        let fieldDOM: Element | null | undefined;
        if (typeof index === 'number') {
            fieldDOM = this.#getErrorFieldDOMs()[index];
        } else if (field) {
            fieldDOM = this.#getErrorFieldDOM(field);
        } else if (typeof field === 'undefined') {
            fieldDOM = this.#getErrorFieldDOMs()[0];
        }
        if (fieldDOM) {
            scrollIntoView(fieldDOM, scrollOpts);
        }
    }

    protected getInitValues(): any {
        return this.adapter.getInitValues();
    }

    protected getInitValue(field?: string) {
        if (typeof field === 'undefined') {
            return this.adapter.getInitValues();
        }
        return ObjectUtil.get(this.adapter.getInitValues(), field);
    }

    protected getFormProps(keys?: Array<string>): ComponentProps {
        return this.adapter.getFormProps(keys);
    }

    override init() {
        // StrictMode runs init -> destroy -> init on one instance
        this.#destroyed = false;
        const { schema, validator } = this.getProps();
        warning(Boolean(schema) && typeof validator === 'function', '[Semi Form] You should not use <Form schema> and <Form validator> at the same time; <Form schema> will be ignored');
    }

    override destroy() {
        this.#destroyed = true;
        this.#cancelDebouncedValidation();
    }

    submit = (e?: E) => {
        const epoch = this.#epoch;
        // then(onResolved, onRejected) rather than .catch: an error thrown by the user's onSubmit must surface instead
        // of being reported as a validation failure
        void this.#validate().then(
            (resolveValues: any) => {
                if (this.#isCancelled(epoch)) {
                    return;
                }
                const _values = this.adapter.cloneDeep(resolveValues);
                this.adapter.notifySubmit(_values, e);
            },
            (errors) => {
                if (this.#isCancelled(epoch)) {
                    return;
                }
                const _errors = this.adapter.cloneDeep(errors);
                const _values = this.adapter.cloneDeep(this.#data.values);
                this.adapter.notifySubmitFail(_errors, _values, e);
            }
        );
    };

    reset = (fieldPaths?: Array<string>) => {
        const targetFields = this.#getOperateFieldMap(fieldPaths);
        if (fieldPaths === undefined) {
            this.#epoch += 1;
            this.#cancelDebouncedValidation();
        } else {
            // only the target fields' validations are outdated; one pending inside validate() or submit settles as passed
            targetFields.forEach((_, path) => this.#validations.delete(path));
        }
        const prevErrors = this.#data.errors;
        this.#batch(() => {
            targetFields.forEach((field) => {
                this.#setFieldValue(field, field.initValue !== null ? this.adapter.cloneDeep(field.initValue) : undefined, SILENT);
                this.#setFieldError(field, undefined, SILENT);
                this.#setFieldTouched(field, undefined, SILENT);
                this.#updateField(field.store, { status: 'default' });
            });
        });
        // errors without a registered field: a validator's other keys, a schema's issues, a kept unmounted field
        if (fieldPaths === undefined) {
            this.#data = { ...this.#data, errors: {} };
            this.#detachedErrorPaths = [];
        }

        if (this.#registeredArrayField.size) {
            this.#resetArrayField(fieldPaths);
        }

        this.adapter.notifyChange(this.#data);
        this.#notifyErrorChange(prevErrors, targetFields.keys());
        this.#forceUpdate();
        this.adapter.notifyReset();
    };

    getFieldBridge = () => {
        return {
            register: this.#register,
            unRegister: this.#unRegister,
            setFieldTouched: this.#setFieldTouched,
            validateField: this.#validateField,
            changeFieldValue: this.#changeFieldValue,
            getValue: this.#getValue,
            getError: this.#getError,
            getTouched: this.#getTouched,
            getInitValues: () => this.getInitValues(),
            getInitValue: (field?: string) => this.getInitValue(field),
            getFormProps: (keys?: Array<string>) => this.getFormProps(keys),
            getField: this.#getField,
            usesSchema: () => Boolean(this.#getSchema()),
            registerArrayField: this.#registerArrayField,
            mountArrayField: this.#mountArrayField,
            unRegisterArrayField: this.#unRegisterArrayField,
            getArrayField: this.#getArrayField,
            addArrayFieldRow: this.#addArrayFieldRow,
            addArrayFieldRowWithValue: this.#addArrayFieldRowWithValue,
            removeArrayFieldRow: this.#removeArrayFieldRow,
            moveArrayFieldRow: this.#moveArrayFieldRow,
        };
    };

    getFormApi = () => {
        const fieldSetterApi = this.#getFieldSetterApi();
        return {
            ...fieldSetterApi,
            reset: (fields?: Array<string>) => this.reset(fields),
            validate: (fields?: Array<string> | ValidateOptions) => this.#validate(fields),
            getValue: (field?: string) => this.#getValue(field, { needClone: true }),
            getValues: () => this.#getValue(undefined, { needClone: true }),
            getFormState: () => this.getFormState(true),
            getFormProps: (props?: Array<string>) => this.getFormProps(props),
            getInitValue: (field?: string) => this.getInitValue(field),
            getInitValues: () => this.getInitValues(),
            getTouched: (field?: string) => this.#getTouched(field),
            getError: (field?: string) => this.#getError(field),
            setValues: (values: any, opts?: setValuesConfig) => this.#setValues(values, opts ?? { isOverride: false }),
            submitForm: () => this.submit(),
            getFieldExist: (field: string) => this.#getFieldExist(field),
            scrollToField: (field: string, scrollOpts?: ScrollIntoViewOptions) => this.#scrollToField(field, scrollOpts),
            scrollToError: (opts?: ScrollToErrorOpts) => this.#scrollToError(opts),
        };
    };

    getFormState = (needClone = false): FormState => {
        // Every write replaces this.#data, but some forceUpdates carry no state change (such as unregistering a
        // keepState field); the shallow copy is a new object per call so useFormState consumers still render again.
        // Deep clone only for formApi.getFormState(): internal readers never mutate the state, users might.
        if (!needClone) {
            return {
                ...this.#data,
            };
        } else {
            return this.adapter.cloneDeep(this.#data);
        }
    };
}
