import { normalizeFieldError, type FieldError, type FieldErrorInput } from './errors';

export type RuleType = 'string' | 'number' | 'integer' | 'float' | 'boolean' | 'array' | 'object' | 'date' | 'email' | 'url' | 'regexp' | 'method';

export interface RuleItem {
    required?: boolean;
    type?: RuleType;
    /** Characters (code points) of a string, items of an array, the value of a number */
    len?: number;
    min?: number;
    max?: number;
    pattern?: RegExp | string;
    enum?: readonly unknown[];
    /** A string of only whitespace counts as empty */
    whitespace?: boolean;
    /** Replaces the default message of every check of this rule; '' fails without a text */
    message?: string;
    transform?: (value: any) => any;
    /** Runs after the built-in checks pass (also on an empty value that is not required); false fails with `message` or the invalid message */
    validator?: (value: any, values: Record<string, any>) => FieldErrorInput | boolean | Promise<FieldErrorInput | boolean>;
}

export interface RuleMessages {
    required: string;
    invalid: string;
    stringLen: string;
    stringMin: string;
    stringMax: string;
    numberLen: string;
    numberMin: string;
    numberMax: string;
    arrayLen: string;
    arrayMin: string;
    arrayMax: string;
}

const EMAIL_REGEXP = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isRegExpLike(value: unknown) {
    if (value instanceof RegExp) {
        return true;
    }
    try {
        return typeof value === 'string' && Boolean(new RegExp(value));
    } catch {
        return false;
    }
}

const typeCheckers: Record<RuleType, (value: unknown) => boolean> = {
    string: (value) => typeof value === 'string',
    number: (value) => typeof value === 'number' && !Number.isNaN(value),
    integer: (value) => Number.isInteger(value),
    float: (value) => typeof value === 'number' && Number.isFinite(value) && !Number.isInteger(value),
    boolean: (value) => typeof value === 'boolean',
    array: (value) => Array.isArray(value),
    object: (value) => typeof value === 'object' && value !== null && !Array.isArray(value),
    date: (value) => value instanceof Date && !Number.isNaN(value.getTime()),
    email: (value) => typeof value === 'string' && EMAIL_REGEXP.test(value),
    url: (value) => typeof value === 'string' && URL.canParse(value) && ['http:', 'https:'].includes(new URL(value).protocol),
    regexp: isRegExpLike,
    method: (value) => typeof value === 'function',
};

function isEmpty(value: unknown, whitespace?: boolean) {
    if (value == null || value === '') {
        return true;
    }
    if (Array.isArray(value)) {
        return value.length === 0;
    }
    return Boolean(whitespace) && typeof value === 'string' && value.trim() === '';
}

function measure(value: unknown) {
    if (typeof value === 'string') {
        return { kind: 'string', size: Array.from(value).length } as const;
    }
    if (Array.isArray(value)) {
        return { kind: 'array', size: value.length } as const;
    }
    if (typeof value === 'number') {
        return { kind: 'number', size: value } as const;
    }
    return undefined;
}

function fillPlaceholders(text: string, rule: RuleItem) {
    return text.replaceAll('${len}', String(rule.len)).replaceAll('${min}', String(rule.min)).replaceAll('${max}', String(rule.max));
}

async function validateRule(rule: RuleItem, rawValue: unknown, values: Record<string, any>, messages: RuleMessages): Promise<FieldError | undefined> {
    const value = rule.transform ? rule.transform(rawValue) : rawValue;
    const fail = (text: string) => [rule.message ?? fillPlaceholders(text, rule)];

    if (isEmpty(value, rule.whitespace)) {
        if (rule.required) {
            return fail(messages.required);
        }
    } else {
        if (rule.type && !typeCheckers[rule.type](value)) {
            return fail(messages.invalid);
        }
        const measured = measure(value);
        if (measured) {
            const { kind, size } = measured;
            if (rule.len != null && size !== rule.len) {
                return fail(messages[`${kind}Len`]);
            }
            if (rule.min != null && size < rule.min) {
                return fail(messages[`${kind}Min`]);
            }
            if (rule.max != null && size > rule.max) {
                return fail(messages[`${kind}Max`]);
            }
        }
        if (rule.pattern != null && typeof value === 'string') {
            const regexp = typeof rule.pattern === 'string' ? new RegExp(rule.pattern) : rule.pattern;
            // A global or sticky RegExp keeps lastIndex between calls, which makes test() alternate between pass and fail
            regexp.lastIndex = 0;
            if (!regexp.test(value)) {
                return fail(messages.invalid);
            }
        }
        if (rule.enum && !rule.enum.includes(value)) {
            return fail(messages.invalid);
        }
    }

    if (!rule.validator) {
        return undefined;
    }
    try {
        const result = await rule.validator(value, values);
        if (result === false) {
            return fail(messages.invalid);
        }
        return typeof result === 'string' || Array.isArray(result) ? normalizeFieldError(result) : undefined;
    } catch (error) {
        return [rule.message ?? (error instanceof Error ? error.message : String(error))];
    }
}

export async function validateRules(rules: readonly RuleItem[], value: unknown, values: Record<string, any>, { messages, first }: { messages: RuleMessages; first?: boolean }): Promise<FieldError | undefined> {
    if (first) {
        for (const rule of rules) {
            const error = await validateRule(rule, value, values, messages);
            if (error) {
                return error;
            }
        }
        return undefined;
    }
    const results = await Promise.all(rules.map((rule) => validateRule(rule, value, values, messages)));
    const errors = results.flatMap((error) => error ?? []);
    return errors.length ? errors : undefined;
}

export function isRequired(rules?: readonly RuleItem[]) {
    return rules?.some((rule) => rule.required === true) ?? false;
}
