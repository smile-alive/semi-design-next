import AsyncValidator from 'async-validator';
import { cloneDeepWith } from 'es-toolkit';
import { joinIds } from '../utils/a11y';
import { createId } from '../utils/uuid';
import warning from '../utils/warning';
import { strings } from './constants';
import type { FieldValidateTriggerType, BasicTriggerType } from './interface';

export function generateValidatesFromRules(field: string, rules: any[] = []) {
    const descriptor = {};
    descriptor[field] = rules;
    const validator = new AsyncValidator(descriptor);
    return validator;
}

export function isRequired(rules: any[] | Record<string, any> = []) {
    let required = false;
    if (typeof rules === 'object' && 'required' in rules) {
        required = rules.required;
    } else if (Array.isArray(rules) && rules.length) {
        rules.forEach((rule) => {
            if (rule.required) {
                required = true;
            }
        });
    }
    return required;
}

export function isValid(errors: any): boolean {
    if (typeof errors === 'string') {
        return !errors.length;
    }
    if (Array.isArray(errors)) {
        return errors.every((error) => isValid(error));
    }
    if (typeof errors === 'boolean') {
        return errors;
    }
    // Any object or function counts as an error: render nodes (React element, Vue VNode, JSX compiled to an accessor)
    // need no per-framework detection
    return errors === null || (typeof errors !== 'object' && typeof errors !== 'function');
}

/** One stable key per ArrayField row: rows that already have a key keep it, new rows get a fresh one */
export function generateKeys(value: unknown, oldKeys: string[] = []) {
    if (!Array.isArray(value)) {
        warning(value !== undefined, '[Semi Form ArrayField] initValue of ArrayField must be an array. Please check the type of your props');
        return [];
    }
    return value.map((_, i) => oldKeys[i] ?? createId());
}

/**
 * trigger transform rule
    1. If the user has set fieldProps, follow the user's fieldProps
    2. If the user does not set fieldProps, follow formProps
    3. If there is no formProps, follow the change
    4. If it is an array, follow the array, if it is not an array (pure string), convert it to a string array
 */

export function transformTrigger(fieldTrigger: FieldValidateTriggerType, formTrigger: FieldValidateTriggerType): Array<BasicTriggerType> {
    let result: BasicTriggerType[] | FieldValidateTriggerType = [];
    let finalResult = [];
    if (fieldTrigger !== undefined) {
        result = fieldTrigger;
    } else if (formTrigger !== undefined) {
        result = formTrigger;
    } else {
        result = strings.DEFAULT_TRIGGER as BasicTriggerType;
    }

    if (Array.isArray(result)) {
        finalResult = result;
    }

    if (typeof result === 'string') {
        finalResult[0] = result;
    }
    return finalResult;
}

export function transformDefaultBooleanAPI(fieldProp: boolean, formProp: boolean, defaultVal = false) {
    if (fieldProp !== undefined) {
        return fieldProp;
    } else if (formProp !== undefined) {
        return formProp;
    } else {
        return defaultVal;
    }
}

let updateKeySeed = 0;

// ArrayField re-reads its lines whenever its updateKey changes; a Date.now() value would repeat within a millisecond
export function nextUpdateKey() {
    updateKeySeed += 1;
    return updateKeySeed;
}

/**
 * The value a field starts from. Outside an ArrayField and in rows it has just added, the field's own initValue wins;
 * after setValues a row field keeps the form value and falls back to initValue only when the form has none.
 */
export function resolveFieldInitValue(initValue: unknown, valueInForm: unknown, shouldUseInitValue: boolean) {
    if (initValue === undefined) {
        return valueInForm;
    }
    if (shouldUseInitValue) {
        return initValue;
    }
    return valueInForm !== undefined ? valueInForm : initValue;
}

/** The props a field falls back to its Form for when it does not set them itself */
export interface FieldConfig {
    labelPosition?: string;
    labelWidth?: number | string;
    labelAlign?: string;
    labelCol?: object;
    wrapperCol?: object;
    extraTextPosition?: string;
    stopValidateWithError?: boolean;
    trigger?: FieldValidateTriggerType;
    allowEmpty?: boolean;
}

export function mergeFieldConfig(field: FieldConfig, form: FieldConfig) {
    return {
        labelPosition: field.labelPosition || form.labelPosition,
        labelWidth: field.labelWidth || form.labelWidth,
        labelAlign: field.labelAlign || form.labelAlign,
        labelCol: field.labelCol || form.labelCol,
        wrapperCol: field.wrapperCol || form.wrapperCol,
        extraTextPosition: field.extraTextPosition || form.extraTextPosition || 'bottom',
        stopValidateWithError: transformDefaultBooleanAPI(field.stopValidateWithError, form.stopValidateWithError, false),
        trigger: transformTrigger(field.trigger, form.trigger),
        allowEmpty: Boolean(field.allowEmpty || form.allowEmpty),
    };
}

/** What decides the aria attributes a field puts on its control; content checks differ per framework, so they come in as booleans */
export interface FieldAriaState {
    /** The aria attributes the caller set on the field: its aria-required wins, its ids come first */
    own: Record<string, unknown>;
    ids: { label: string; helpText: string; extraText: string; errorMessage: string };
    rulesRequired: boolean;
    label?: { required?: boolean; optional?: boolean };
    /** labelPosition after the inset fallback */
    labelPosition?: string;
    noLabel?: boolean;
    noErrorMessage?: boolean;
    pure?: boolean;
    inGroup: boolean;
    hasHelpText: boolean;
    hasExtraText: boolean;
    error: unknown;
    errorHasContent: boolean;
    status?: string;
    /** The shown status: validateStatus when set, otherwise the validation status */
    shownStatus?: string;
}

export interface FieldAriaProps {
    'aria-required': unknown;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
    'aria-invalid'?: true;
    'aria-errormessage'?: string;
}

/** Each id is referenced only while the layout renders its element; helpText shows only without an error */
export function getFieldAriaProps(state: FieldAriaState) {
    const { own, ids, label, error, status, shownStatus } = state;
    const ownLayout = !state.inGroup && !state.pure;
    const ownErrorMessage = ownLayout && !state.noErrorMessage;
    // the inset label renders in every layout, the Label only in the field's own one
    const labelRendered = !state.noLabel && (state.labelPosition === 'inset' || ownLayout);
    const helpTextRendered = ownErrorMessage && state.hasHelpText && !error && !(error === '' && shownStatus === 'error');
    const aria: FieldAriaProps = {
        // the same condition as the Label's asterisk
        'aria-required': own['aria-required'] ?? (state.rulesRequired || Boolean(label?.required && !label.optional)),
        'aria-labelledby': joinIds(own['aria-labelledby'], labelRendered && ids.label),
        'aria-describedby': joinIds(own['aria-describedby'], helpTextRendered && ids.helpText, ownLayout && state.hasExtraText && ids.extraText),
    };
    // a failed validation stays invalid under another validateStatus, which still renders its error message;
    // validateStatus="error" marks the control invalid as well
    if (shownStatus === 'error' || status === 'error') {
        aria['aria-invalid'] = true;
    }
    if (status === 'error' && ownErrorMessage && state.errorHasContent) {
        aria['aria-errormessage'] = ids.errorMessage;
    } else if (state.inGroup && !(status === 'error' && state.errorHasContent)) {
        // clears the error message id the group hands every field; the group lists only errors with content
        aria['aria-errormessage'] = undefined;
    }
    return aria;
}

/**
 * Deep copy of a form value. Functions, errors, blobs and framework nodes (`isOpaque`) are kept by reference: validators
 * and transforms live in the values, a validator's thrown Error must reach the caller as the same object, a rendered
 * node is not data, and a Blob (File included) is immutable while copying one aborts the Node process.
 */
export function cloneFormValue<T>(value: T, isOpaque: (value: unknown) => boolean) {
    return cloneDeepWith<T>(value, (item) => {
        if (typeof item === 'function' || isOpaque(item) || item instanceof Blob || item instanceof Error || Object.prototype.toString.call(item) === '[object Error]') {
            return item;
        }
        // An array indexed beyond the max length (4294967294) reports length 0 but keeps the keys
        if (Array.isArray(item) && item.length === 0 && Object.keys(item).length > 0) {
            warning(true, '[Semi] You may use an out-of-bounds array. In some cases, your program may not behave as expected. The maximum length of an array is 4294967295. Please check whether the array subscript in your data exceeds the maximum value of the JS array subscript');
            return Object.assign([], item);
        }
        return undefined;
    });
}
