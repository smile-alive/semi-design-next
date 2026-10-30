import type { ValidateError } from 'async-validator';
import { isPlainObject } from 'es-toolkit';
import { toPath } from 'es-toolkit/compat';
import scrollIntoViewIfNeeded, { type Options as ScrollIntoViewOptions } from 'scroll-into-view-if-needed';
import BaseFoundation from '../base/foundation';
import isPromise from '../utils/is-promise';
import * as ObjectUtil from '../utils/object';
import { cssClasses } from './constants';
import type FieldStore from './field-store';
import type { BaseFormAdapter, FormState, CallOpts, FieldRegistration, ComponentProps, setValuesConfig, ArrayFieldRegistration, ValidateOptions, ChangeFieldValueOptions, FieldSnapshot } from './interface';
import { generateValidatesFromRules, isValid, nextUpdateKey } from './utils';

const SILENT: CallOpts = { skipNotify: true, skipRender: true };

const prefix = cssClasses.PREFIX;
const ERROR_SELECTOR = `.${prefix}-field-error-message`;
const errorField = (errorDOM: Element) => errorDOM.closest(`.${prefix}-field, .${prefix}-field-group`);
// The library types standard and custom `behavior` as separate overloads; Form passes the caller's options, either kind, through
const scrollIntoView = scrollIntoViewIfNeeded as (target: Element, options: ScrollIntoViewOptions) => unknown;

export type { BaseFormAdapter } from './interface';

// Same as Formik: falsy or a plain object without own keys passes. Error instances and Promises have no own keys but
// are not plain objects, so a thrown Error still fails.
function isFormValidatorPassed(result: unknown) {
    if (!result) {
        return true;
    }
    return Object.getPrototypeOf(result) === Object.prototype && Object.keys(result).length === 0;
}

/** Whether `path` is `ancestor` or a path under it, compared by segment: `a[1]` is under `a`, `ab` is not */
function isPathWithin(path: string, ancestor: string) {
    const segments = toPath(path);
    return toPath(ancestor).every((segment, i) => segment === segments[i]);
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
    // The Form's own cleanup runs before its fields' (React unmounts a parent's layout effects first)
    #destroyed = false;
    // reset() of the whole Form starts a new epoch: a validation started in an older one settles without writing or
    // reporting
    #epoch = 0;
    // The newest non-silent form-level validation; an older one still settles with its own result but writes nothing
    #formValidation = 0;
    // Set from an unregister until the render after it, which reports the values once
    #unregisterNotifyPending = false;

    constructor(adapter: BaseFormAdapter<Record<string, any>, Record<string, any>, any, E>) {
        super(adapter);
        // initValues is read here too: a field set on the Form may have no Field entity,
        // so the initial value cannot rely on the register moment alone
        let { initValues } = this._adapter.getProps();
        initValues = this._adapter.cloneDeep(initValues);

        this.#data = {
            values: initValues ? initValues : {},
            errors: {},
            touched: {},
        };

        this.#fields = new Map();

        this.#registered = {};

        this.#registeredArrayField = new Map();
    }

    #forceUpdate(callback?: () => void) {
        this._adapter.forceUpdate(this.getFormState(), callback);
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
        this._adapter.notifyChange(this.#data);
        this.#notifyErrorChange(prevErrors, this.#fields.keys());
        this.#forceUpdate();
    }

    // A failed form-level validator replaces formState.errors as a whole, keys without a Field included. Only an object
    // maps errors to paths: another result (a string) still reaches the caller through the rejection, but writing it
    // would make later field errors spread its characters into keys.
    #setFormErrors(errors: unknown) {
        const formErrors = isPlainObject(errors) ? errors : {};
        const prevErrors = this.#data.errors;
        this.#data = { ...this.#data, errors: formErrors };
        this.#injectErrorToField(formErrors);
        this._adapter.notifyChange(this.#data);
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
            if (error !== ObjectUtil.get(prevErrors, path)) {
                changedError[path] = error;
            }
        }
        if (Object.keys(changedError).length) {
            this._adapter.notifyErrorChange(this.#data.errors, changedError);
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
                resolve(this._adapter.cloneDeep(this.#data.values));
                if (writes()) {
                    this.#clearFormErrors();
                }
            };
            const fail = (errors: unknown) => {
                if (writes()) {
                    this.#setFormErrors(errors);
                }
                reject(errors);
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

    #fieldsValidate(fieldPaths?: Array<string>, silent: boolean = false) {
        return new Promise((resolve, reject) => {
            let promiseSet: Promise<any>[] = [];
            const targetFields = this.#getOperateFieldMap(fieldPaths);
            // Fields may register, unregister or be renamed before the results settle; the results follow these paths
            const paths = [...targetFields.keys()];
            const epoch = this.#epoch;
            const prevErrors = this.#data.errors;
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
            void Promise.all(promiseSet).then((results) => {
                if (this.#isCancelled(epoch)) {
                    reject(this.#cancelError());
                    return;
                }
                // A validated field fails on any error value but undefined, '' included: a rule with `message: ''`
                // fails without a text. A field with nothing to validate (null result) keeps the error set on it.
                let errors = this.#getError();
                let valid = paths.every((path, i) => (results[i] === null ? isValid(ObjectUtil.get(errors, path)) : results[i] === undefined));
                if (silent) {
                    // A silent validation writes nothing to formState, so its errors come from the settled results,
                    // which are each field's error value (undefined when valid, null without validation)
                    errors = {};
                    paths.forEach((fieldPath, i) => {
                        if (results[i] != null) {
                            errors = ObjectUtil.set(errors, fieldPath, results[i]);
                        }
                    });
                    valid = ObjectUtil.isEmpty(errors);
                }
                if (!silent) {
                    this._adapter.notifyChange(this.#data);
                    this.#notifyErrorChange(prevErrors, paths);
                    // the error messages the scroll looks for exist only once this update is rendered
                    this.#forceUpdate(valid ? undefined : () => this.#autoScroll());
                }
                if (valid) {
                    const _values = this._adapter.cloneDeep(this.#data.values);
                    resolve(_values);
                } else {
                    reject(errors);
                }
            });
        });
    }

    /**
     * Case A：
     *      All fields: a[0]、a[1]、b.type、b.name[2]、b.name[0]
     *      input => output:
     *           a  => a[0]、a[1]
     *           b  => b.type、b.name[0]、b.name[2]
     *
     * Case B：
     *      All fields: activity.a[0]、activity.a[1]、activity.c、activity.d、other
     *      input => output:
     *           activity.a => activity.a[0]、activity.a[1]
     *
     */
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
            const arrayFieldInitValue = this._adapter.cloneDeep(arrayFieldState.initValue);
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

    #getField = (field: string) => {
        return this.#fields.get(field);
    };

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

    /** Resolves with the field's error value, undefined when valid */
    #validateRules(registration: FieldRegistration, value: unknown, opts: CallOpts) {
        const { field } = registration;
        const { rules, stopValidateWithError } = registration.getValidateOptions();
        const validator = generateValidatesFromRules(field, rules);
        const epoch = this.#epoch;
        const silent = Boolean(opts.silent);
        const validation = new Promise((resolve) => {
            validator
                .validate({ [field]: value }, { first: stopValidateWithError }, () => {})
                .then(() => {
                    if (this.#isSuperseded(registration, validation, epoch, silent, resolve)) {
                        return;
                    }
                    this.#setFieldError(registration, undefined, { ...opts, status: 'success' });
                    resolve(undefined);
                })
                .catch((err) => {
                    if (this.#isSuperseded(registration, validation, epoch, silent, resolve)) {
                        return;
                    }
                    const { errors, fields } = err;
                    if (errors && fields) {
                        let messages = errors.map((e: ValidateError) => e.message);
                        if (messages.length === 1) {
                            messages = messages[0];
                        }
                        // `message: ''` in async-validator means "fail, but hide the text". `messages` is then '' and
                        // isValid('') is true, so an isValid check would never resolve and submit() / validate() would
                        // hang. The error is decided by errors.length instead, and '' stays the field error value so
                        // getError(field) === '' still detects "invalid without text".
                        if (Array.isArray(errors) && errors.length > 0) {
                            this.#setFieldError(registration, messages, { ...opts, status: 'error' });
                            resolve(messages);
                        }
                    } else {
                        // not a validation failure: the rules themselves are malformed
                        this.#setFieldError(registration, err.message, { ...opts, status: 'error' });
                        resolve(err.message);
                        throw err;
                    }
                });
        });
        if (!silent) {
            this.#validations.set(field, validation);
        }
        return validation;
    }

    /** Resolves with the field's error value, undefined when valid */
    #validateCustom(registration: FieldRegistration, value: unknown, opts: CallOpts) {
        const { validate } = registration.getValidateOptions();
        const epoch = this.#epoch;
        const silent = Boolean(opts.silent);
        const validation = new Promise((resolve) => {
            let maybePromisedErrors;
            try {
                maybePromisedErrors = validate(value, this.#getValue());
            } catch (err) {
                // a throwing sync validate reports its error as the result
                maybePromisedErrors = err;
            }
            const settle = (result: unknown) => {
                const error = isValid(result) ? undefined : result;
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
     * before the field registers. A field-level `validate` wins over `rules`; a field with neither has nothing to
     * validate.
     */
    #validateField = (registration: FieldRegistration, value: unknown, opts: CallOpts = {}): Promise<unknown> | null => {
        const { rules, validate, transform } = registration.getValidateOptions();
        const finalValue = transform ? transform(value) : value;
        if (validate) {
            return this.#validateCustom(registration, finalValue, opts);
        }
        if (rules) {
            return this.#validateRules(registration, finalValue, opts);
        }
        return null;
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
                    void this.#validateField(registration, nextValue);
                }
            } catch (err) {
                this.#setFieldValue(registration, prevValue, SILENT);
                throw err;
            }
        });
    };

    // The field's store carries its state across re-registration (rename, ArrayField row removal, Activity).
    #register = (field: string, registration: FieldRegistration) => {
        const fieldState = registration.store.getSnapshot();
        const registered = this.#registered[field];
        this.#registered[field] = true;
        this.#fields.set(field, registration);
        const allowEmpty = registration.allowEmpty || false;
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

        if (!(registration.keepState && registered)) {
            this.#updateStateValue(field, fieldValue, opts);
            if (fieldState.error) {
                this.#updateStateError(field, fieldState.error, opts);
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
            this._adapter.notifyChange(this.#data);
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
            .sort((a, b) => toPath(a).length - toPath(b).length)
            .map((path) => ({ path, allowEmpty: false }));
        const nestedFields = [...this.#fields.values()].filter((registration) => isNested(registration.field)).map((registration) => ({ path: registration.field, allowEmpty: registration.allowEmpty }));
        const nestedValues = [...nestedArrayFields, ...nestedFields].map((item) => ({
            ...item,
            value: this.#getValue(item.path),
        }));

        this.#registerArrayField(arrayFieldPath, val);
        this.#updateStateValue(arrayFieldPath, this._adapter.cloneDeep(val), SILENT);
        nestedValues.forEach(({ path, allowEmpty, value }) => {
            this.#updateStateValue(path, value, { ...SILENT, allowEmpty });
        });
        // reset() restores what the rows show now, their own initValue included
        this.#updateArrayField(arrayFieldPath, { initValue: this._adapter.cloneDeep(this.#getValue(arrayFieldPath)) });
        this.#forceUpdate();
    };

    /** Inserts an empty row before `index`, or appends one without it; returns the ArrayField's new updateKey */
    #addArrayFieldRow = (arrayFieldPath: string, index?: number) => {
        if (typeof index === 'number') {
            const values = this.#getValue(arrayFieldPath);
            if (Array.isArray(values)) {
                this.#updateStateValue(arrayFieldPath, values.toSpliced(index, 0, undefined), SILENT);
            }
            const errors = this.#getError(arrayFieldPath);
            if (Array.isArray(errors)) {
                this.#updateStateError(arrayFieldPath, errors.toSpliced(index, 0, undefined), SILENT);
            }
        }
        const updateKey = nextUpdateKey();
        this.#updateArrayField(arrayFieldPath, { updateKey });
        this.#forceUpdate();
        return updateKey;
    };

    /** Inserts a row holding `rowValue` before `index`, or appends it without one */
    #addArrayFieldRowWithValue = (arrayFieldPath: string, rowValue: unknown, index?: number) => {
        const values = this.#getValue(arrayFieldPath);
        const rows = values ? values.slice() : [];
        const rowIndex = typeof index === 'number' ? Math.max(0, Math.min(index, rows.length)) : rows.length;
        rows.splice(rowIndex, 0, this._adapter.cloneDeep(rowValue));
        const updateKey = nextUpdateKey();
        this.#updateArrayField(arrayFieldPath, { updateKey });
        this.#updateStateValue(arrayFieldPath, rows, {});
        return { index: rowIndex, updateKey };
    };

    /** Every key of the row is removed too: some keys are set only in initValue and never taken over by a field */
    #removeArrayFieldRow = (arrayFieldPath: string, index: number) => {
        const errors = this.#getError(arrayFieldPath);
        if (Array.isArray(errors)) {
            this.#updateStateError(arrayFieldPath, errors.toSpliced(index, 1), SILENT);
        }
        const values = this.#getValue(arrayFieldPath);
        if (Array.isArray(values)) {
            this.#updateStateValue(arrayFieldPath, values.toSpliced(index, 1), {});
        }
    };

    #unRegisterArrayField = (arrayField: string) => {
        this.#registeredArrayField.delete(arrayField);
    };

    #getArrayField = (arrayField: string) => {
        return this.#registeredArrayField.get(arrayField);
    };

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
            silent = options.silent || false;
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
        return opts?.needClone ? this._adapter.cloneDeep(value) : value;
    };

    #setValues(values: any, { isOverride = false }) {
        const _values = this._adapter.cloneDeep(values);
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

        this._adapter.notifyChange(this.#data);
        this._adapter.notifyValueChange(this.#data.values, { ...values });
        this.#forceUpdate();
    }

    #updateStateValue = (field: string, value: any, opts: CallOpts, callback?: () => void) => {
        const skipNotify = opts && opts.skipNotify;
        const skipRender = opts && opts.skipRender;

        const allowEmpty = (opts && opts.allowEmpty) || this.getProp('allowEmpty');

        this.#data = { ...this.#data, values: ObjectUtil.set(this.#data.values, field, value, allowEmpty) };
        // Registering syncs a Field's initValue into FormState without notify, but still needs a forceUpdate:
        // otherwise the first render of useFormState and useFieldState is wrong
        if (!skipNotify) {
            this._adapter.notifyChange(this.#data);
            this._adapter.notifyValueChange(this.#data.values, { [field]: value });
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
        const skipNotify = opts && opts.skipNotify;
        const skipRender = opts && opts.skipRender;
        this.#data = { ...this.#data, touched: ObjectUtil.set(this.#data.touched, field, isTouched) };

        if (!skipNotify) {
            this._adapter.notifyChange(this.#data);
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
        const skipNotify = opts && opts.skipNotify;
        const skipRender = opts && opts.skipRender;
        this.#data = { ...this.#data, errors: ObjectUtil.set(this.#data.errors, field, error) };

        // Batch operations skip notify here and report once when done; they would otherwise fire once per field
        if (!skipNotify) {
            this._adapter.notifyChange(this.#data);
            this._adapter.notifyErrorChange(this.#data.errors, { [field]: error });
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
            if (error === store.getSnapshot().error) {
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
                this.#setByPath('values', field, this._adapter.cloneDeep(value), opts);
            },
            setError: (field: string, error: any, opts?: CallOpts) => this.#setByPath('errors', field, this._adapter.cloneDeep(error), opts),
            setTouched: (field: string, isTouched: boolean | Record<string, any>, opts?: CallOpts) => this.#setByPath('touched', field, isTouched, opts),
        };
    }

    #getFieldExist(field: string) {
        return Boolean(this.#fields.has(field));
    }

    // Queried from the form element rather than document, so a Form inside a ShadowRoot finds its fields (F13)
    #getFieldDOM(field: string) {
        return this._adapter.getFormElement()?.querySelector(`.${prefix}-field[x-field-id="${CSS.escape(field)}"]`) ?? null;
    }

    /** The root elements of the fields showing an error message, in document order */
    #getErrorFieldDOMs() {
        const errorDOMs = this._adapter.getFormElement()?.querySelectorAll(ERROR_SELECTOR) ?? [];
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
        return this._adapter.getInitValues();
    }

    protected getInitValue(field?: string) {
        if (typeof field === 'undefined') {
            return this._adapter.getInitValues();
        }
        return ObjectUtil.get(this._adapter.getInitValues(), field);
    }

    protected getFormProps(keys?: Array<string>): ComponentProps {
        return this._adapter.getFormProps(keys);
    }

    override init() {
        // StrictMode runs init -> destroy -> init on one instance
        this.#destroyed = false;
    }

    override destroy() {
        this.#destroyed = true;
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
                const _values = this._adapter.cloneDeep(resolveValues);
                this._adapter.notifySubmit(_values, e);
            },
            (errors) => {
                if (this.#isCancelled(epoch)) {
                    return;
                }
                const _errors = this._adapter.cloneDeep(errors);
                const _values = this._adapter.cloneDeep(this.#data.values);
                this._adapter.notifySubmitFail(_errors, _values, e);
            }
        );
    };

    reset = (fieldPaths?: Array<string>) => {
        const targetFields = this.#getOperateFieldMap(fieldPaths);
        if (fieldPaths === undefined) {
            this.#epoch += 1;
        } else {
            // only the target fields' validations are outdated; one pending inside validate() or submit settles as passed
            targetFields.forEach((_, path) => this.#validations.delete(path));
        }
        const prevErrors = this.#data.errors;
        this.#batch(() => {
            targetFields.forEach((field) => {
                this.#setFieldValue(field, field.initValue !== null ? this._adapter.cloneDeep(field.initValue) : undefined, SILENT);
                this.#setFieldError(field, undefined, SILENT);
                this.#setFieldTouched(field, undefined, SILENT);
                this.#updateField(field.store, { status: 'default' });
            });
        });

        if (this.#registeredArrayField.size) {
            this.#resetArrayField(fieldPaths);
        }

        this._adapter.notifyChange(this.#data);
        this.#notifyErrorChange(prevErrors, targetFields.keys());
        this.#forceUpdate();
        this._adapter.notifyReset();
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
            registerArrayField: this.#registerArrayField,
            mountArrayField: this.#mountArrayField,
            unRegisterArrayField: this.#unRegisterArrayField,
            getArrayField: this.#getArrayField,
            addArrayFieldRow: this.#addArrayFieldRow,
            addArrayFieldRowWithValue: this.#addArrayFieldRowWithValue,
            removeArrayFieldRow: this.#removeArrayFieldRow,
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
            setValues: (values: any, opts?: setValuesConfig) => this.#setValues(values, opts || { isOverride: false }),
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
            return this._adapter.cloneDeep(this.#data);
        }
    };
}
