import { toPath } from 'es-toolkit/compat';
import { formatLocale, type Locale } from '../../locale/index';
import type { StandardSchema } from './interface';

export type JsonSchema = Record<string, any>;

export type SchemaFieldKind = 'input' | 'textarea' | 'number' | 'switch' | 'select' | 'object' | 'array' | 'unsupported';

export interface SchemaFieldNode {
    kind: SchemaFieldKind;
    /** Concrete field path: `contacts[0].email`; '' for the root */
    field: string;
    /** The renderField key: array items as `[]`, `contacts[].email` */
    pattern: string;
    /** Property name, or the row index of an array item */
    key: string | number;
    /** `title`, else the property name; undefined for an array item */
    title?: string;
    description?: string;
    /** Path segments from the schema root: 0 for the root, also when SchemaField starts below it */
    depth: number;
    /** Set on an array item: its row index and the array's title (undefined for an untitled array item) and key */
    item?: { index: number; arrayTitle?: string; arrayKey: string | number };
    required: boolean;
    format?: string;
    default?: unknown;
    /** The resolved node: $ref and nullable wrappers removed */
    schema: JsonSchema;
    options?: Array<{ label: string; value: string | number | boolean }>;
    multiple?: boolean;
    integer?: boolean;
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    minItems?: number;
    maxItems?: number;
    /** Rows can be neither added nor removed: minItems === maxItems */
    fixed?: boolean;
    /** Object: the property nodes in schema order */
    children?: SchemaFieldNode[];
}

interface Resolved {
    schema: JsonSchema;
    /** The $ref targets entered on the way down: meeting one again means the schema recurses */
    seen: string[];
}

const SINGLE_LINE_MAX_LENGTH = 160;
const INHERITED_KEYWORDS = ['title', 'description', 'default'] as const;
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

const isObject = (value: unknown): value is JsonSchema => typeof value === 'object' && value !== null && !Array.isArray(value);

const isNullSchema = (schema: JsonSchema) => schema?.type === 'null';

/** The unwrapped schema keeps what the author wrote on the wrapper */
function inherit(outer: JsonSchema, inner: JsonSchema) {
    const merged = { ...inner };
    for (const keyword of INHERITED_KEYWORDS) {
        if (Object.hasOwn(outer, keyword)) merged[keyword] = outer[keyword];
    }
    return merged;
}

function findRef(root: JsonSchema, ref: string) {
    let target: unknown = root;
    for (const part of ref.slice(1).split('/').slice(1)) {
        target = (target as JsonSchema)?.[decodeURIComponent(part).replaceAll('~1', '/').replaceAll('~0', '~')];
    }
    if (!isObject(target)) throw new Error(`Cannot resolve $ref "${ref}"`);
    return target;
}

/** A $ref that recurses or points outside root stays in `schema`, so it has no type and becomes `unsupported` */
function resolve(root: JsonSchema, schema: JsonSchema, seen: string[]) {
    let current = schema;
    for (;;) {
        if (typeof current.$ref === 'string') {
            const ref: string = current.$ref;
            if (!ref.startsWith('#') || seen.includes(ref)) break;
            seen = [...seen, ref];
            current = inherit(current, findRef(root, ref));
            continue;
        }
        if (Array.isArray(current.type)) {
            const types = current.type.filter((type) => type !== 'null');
            if (types.length !== 1) break;
            current = { ...current, type: types[0] };
            continue;
        }
        const variants = Array.isArray(current.anyOf) ? current.anyOf : current.oneOf;
        const rest = Array.isArray(variants) ? variants.filter((variant) => !isNullSchema(variant)) : [];
        if (rest.length !== 1) break;
        current = inherit(current, rest[0]);
    }
    return { schema: current, seen };
}

function optionsOf(schema: JsonSchema) {
    let entries: Array<{ value: unknown; title?: string }> | undefined;
    if (Array.isArray(schema.enum)) {
        entries = schema.enum.map((value) => ({ value }));
    } else {
        const variants = (schema.oneOf ?? schema.anyOf)?.filter((variant) => !isNullSchema(variant));
        if (variants?.length && variants.every((variant) => isObject(variant) && Object.hasOwn(variant, 'const'))) {
            entries = variants.map((variant) => ({ value: variant.const, title: variant.title }));
        }
    }
    if (!entries?.every(({ value }) => ['string', 'number', 'boolean'].includes(typeof value))) return undefined;
    return entries.map(({ value, title }) => ({ label: title ?? String(value), value: value as string | number | boolean }));
}

const bound = (values: Array<number | undefined>, pick: (...numbers: number[]) => number) => {
    const numbers = values.filter((value) => typeof value === 'number');
    return numbers.length ? pick(...numbers) : undefined;
};

// Property names that are not identifiers (`first-name`, `a.b`) need brackets to survive toPath
const childPath = (field: string, name: string) => (IDENTIFIER.test(name) ? (field ? `${field}.${name}` : name) : `${field}[${JSON.stringify(name)}]`);

const isRequired = (parent: JsonSchema, name: string) => Array.isArray(parent.required) && parent.required.includes(name);

function buildNode(root: JsonSchema, { schema, seen }: Resolved, field: string, key: string | number, required: boolean, fallbackTitle?: string, item?: SchemaFieldNode['item']): SchemaFieldNode {
    const base = {
        field,
        pattern: field.replaceAll(/\[\d+\]/g, '[]'),
        key,
        title: schema.title ?? fallbackTitle,
        description: schema.description,
        depth: field === '' ? 0 : toPath(field).length,
        item,
        required,
        format: schema.format,
        default: schema.default,
        schema,
    };

    const options = optionsOf(schema);
    if (options) return { ...base, kind: 'select', options };

    switch (schema.type) {
        case 'string':
            return { ...base, kind: schema.maxLength > SINGLE_LINE_MAX_LENGTH ? 'textarea' : 'input', minLength: schema.minLength, maxLength: schema.maxLength };
        case 'number':
        case 'integer': {
            const integer = schema.type === 'integer';
            // An exclusive bound of a real number has no closest value, so the bound itself is a close approximation
            const step = integer ? 1 : 0;
            return {
                ...base,
                kind: 'number',
                integer,
                minimum: bound([schema.minimum, typeof schema.exclusiveMinimum === 'number' ? schema.exclusiveMinimum + step : undefined], Math.max),
                maximum: bound([schema.maximum, typeof schema.exclusiveMaximum === 'number' ? schema.exclusiveMaximum - step : undefined], Math.min),
            };
        }
        case 'boolean':
            return { ...base, kind: 'switch' };
        case 'object': {
            if (!isObject(schema.properties)) break;
            const children = Object.entries<JsonSchema>(schema.properties).map(([name, property]) => buildNode(root, resolve(root, property, seen), childPath(field, name), name, isRequired(schema, name), name));
            return { ...base, kind: 'object', children };
        }
        case 'array': {
            if (schema.prefixItems || !isObject(schema.items)) break;
            const { minItems, maxItems } = schema;
            const itemOptions = optionsOf(resolve(root, schema.items, seen).schema);
            if (itemOptions) return { ...base, kind: 'select', multiple: true, options: itemOptions, minItems, maxItems };
            return { ...base, kind: 'array', minItems, maxItems, fixed: minItems !== undefined && minItems === maxItems };
        }
    }
    return { ...base, kind: 'unsupported' };
}

/** Explicit wins; otherwise the Form schema's Standard JSON Schema input (target draft-2020-12); undefined when neither exists */
export function resolveJsonSchema(jsonSchema?: JsonSchema, schema?: StandardSchema): JsonSchema | undefined {
    if (jsonSchema || !schema) return jsonSchema;
    // every SchemaField under one Form (one per array row included) shares the conversion of its schema
    let converted = convertedSchemas.get(schema);
    if (!converted) {
        converted = schema['~standard'].jsonSchema?.input({ target: 'draft-2020-12' });
        if (converted) convertedSchemas.set(schema, converted);
    }
    return converted;
}

const convertedSchemas = new WeakMap<StandardSchema, JsonSchema>();

/** The node at `field` ('' = root), walking properties and items; throws when the path is not in the schema */
export function describeSchemaField(root: JsonSchema, field = '') {
    const fail = () => new Error(`Schema has no field "${field}"`);
    let current = resolve(root, root, []);
    let key: string | number = '';
    let required = false;
    let fallbackTitle: string | undefined;
    let item: SchemaFieldNode['item'];

    for (const segment of field === '' ? [] : toPath(field)) {
        const parent = current.schema;
        let child: unknown;
        if (parent.type === 'array') {
            if (!/^\d+$/.test(segment)) throw fail();
            child = parent.items;
            item = { index: Number(segment), arrayTitle: parent.title ?? fallbackTitle, arrayKey: key };
            key = item.index;
            required = false;
            fallbackTitle = undefined;
        } else {
            item = undefined;
            if (parent.type !== 'object' || !isObject(parent.properties) || !Object.hasOwn(parent.properties, segment)) throw fail();
            child = parent.properties[segment];
            key = segment;
            required = isRequired(parent, segment);
            fallbackTitle = segment;
        }
        if (!isObject(child)) throw fail();
        current = resolve(root, child, current.seen);
    }
    return buildNode(root, current, field, key, required, fallbackTitle, item);
}

/**
 * The semiRenderers name of a single-value array row, undefined for any other node. Such a row shows no label or
 * description: the array's Section shows them once, and the row is named "<array title> item N".
 */
export function singleItemName({ item, kind }: SchemaFieldNode, messages: Pick<Locale['Form'], 'item' | 'arrayItem'>) {
    if (!item || kind === 'object' || kind === 'array') return undefined;
    const index = item.index + 1;
    return item.arrayTitle === undefined ? formatLocale(messages.item, { index }) : formatLocale(messages.arrayItem, { title: item.arrayTitle, index });
}

/** What an array node allows with `count` rows; a fixed array (minItems === maxItems) neither adds nor removes */
export function arrayState(node: SchemaFieldNode, count: number) {
    const { minItems, maxItems } = node;
    const fixed = Boolean(node.fixed);
    return { count, minItems, maxItems, fixed, canAdd: !fixed && (maxItems === undefined || count < maxItems), canRemove: !fixed && count > (minItems ?? 0) };
}

/** The props semiRenderers gives the Form control of a leaf node, by kind */
export function controlProps(node: SchemaFieldNode) {
    switch (node.kind) {
        case 'input':
            return { maxLength: node.maxLength };
        case 'textarea':
            return { maxCount: node.maxLength };
        case 'number':
            return { max: node.maximum, min: node.minimum, precision: node.integer ? 0 : undefined };
        case 'select':
            return { multiple: node.multiple, optionList: node.options };
        default:
            return {};
    }
}

export const schemaFieldWarnings = {
    noSchema: '[Semi Form] SchemaField has no JSON Schema: pass jsonSchema, or give the Form a schema that exports one',
    noRenderer: (field: string, kind: string) => `[Semi Form] SchemaField renders nothing for "${field}": renderers has no ${kind} entry`,
    unsupported: (field: string) => `[Semi Form] SchemaField renders nothing for "${field}": its schema maps to no control`,
};

function blankValue(root: JsonSchema, { schema, seen }: Resolved): unknown {
    if (schema.type === 'object') {
        const row: Record<string, unknown> = {};
        for (const [name, property] of Object.entries<JsonSchema>(schema.properties ?? {})) {
            if (!isRequired(schema, name)) continue;
            const value = blankValue(root, resolve(root, property, seen));
            if (value !== undefined) row[name] = value;
        }
        return row;
    }
    if (schema.type === 'array') {
        const items = isObject(schema.items) ? resolve(root, schema.items, seen) : undefined;
        return Array.from({ length: schema.minItems ?? 0 }, () => items && blankValue(root, items));
    }
    return undefined;
}

/**
 * Value of a new row of the array at `arrayField`: object -> {} with required nested objects and arrays prefilled
 * (arrays with minItems blank rows), other -> undefined
 */
export function blankRow(root: JsonSchema, arrayField: string) {
    const { items } = describeSchemaField(root, arrayField).schema;
    return isObject(items) ? blankValue(root, resolve(root, items, [])) : undefined;
}
