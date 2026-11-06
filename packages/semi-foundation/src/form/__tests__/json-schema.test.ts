import { describe, expect, it } from 'vite-plus/test';
import * as z from 'zod';
import type { StandardSchema } from '../interface';
import { blankRow, describeSchemaField, resolveJsonSchema, type JsonSchema } from '../json-schema';

const describeProperty = (property: JsonSchema, root: JsonSchema = {}) => describeSchemaField({ type: 'object', properties: { value: property }, ...root }, 'value');

describe('describeSchemaField kind', () => {
    it('string 映射为 input 并带出 format 与长度限制', () => {
        expect(describeProperty({ type: 'string', format: 'uri', minLength: 2, maxLength: 10 })).toMatchObject({ kind: 'input', format: 'uri', minLength: 2, maxLength: 10 });
    });

    it('maxLength 超过 160 才映射为 textarea', () => {
        expect(describeProperty({ type: 'string', maxLength: 160 }).kind).toBe('input');
        expect(describeProperty({ type: 'string', maxLength: 161 }).kind).toBe('textarea');
    });

    it('number 与 integer 映射为 number 并区分 integer', () => {
        expect(describeProperty({ type: 'number', minimum: 1, maximum: 5 })).toMatchObject({ kind: 'number', integer: false, minimum: 1, maximum: 5 });
        expect(describeProperty({ type: 'integer' })).toMatchObject({ kind: 'number', integer: true });
    });

    it('exclusive 边界：integer 向内收一位，number 取原值', () => {
        expect(describeProperty({ type: 'integer', exclusiveMinimum: 0, exclusiveMaximum: 10 })).toMatchObject({ minimum: 1, maximum: 9 });
        expect(describeProperty({ type: 'number', exclusiveMinimum: 0.5, exclusiveMaximum: 2.5 })).toMatchObject({ minimum: 0.5, maximum: 2.5 });
    });

    it('同时给出 minimum 与 exclusive 边界时取更严的一个', () => {
        expect(describeProperty({ type: 'integer', minimum: 5, exclusiveMinimum: 0, maximum: 3, exclusiveMaximum: 10 })).toMatchObject({ minimum: 5, maximum: 3 });
    });

    it('boolean 映射为 switch', () => {
        expect(describeProperty({ type: 'boolean' }).kind).toBe('switch');
    });

    it.each([
        ['缺少 type', { minLength: 1 }],
        ['const 单值', { const: 'a' }],
        ['记录类型', { type: 'object', additionalProperties: { type: 'string' } }],
        ['没有 properties 的 object', { type: 'object' }],
        ['联合类型', { type: ['string', 'number'] }],
        ['多分支 anyOf', { anyOf: [{ type: 'string' }, { type: 'number' }] }],
        ['元组', { type: 'array', prefixItems: [{ type: 'string' }] }],
        ['没有 items 的 array', { type: 'array' }],
    ])('%s 映射为 unsupported', (_name, property) => {
        expect(describeProperty(property).kind).toBe('unsupported');
    });
});

describe('describeSchemaField select', () => {
    it('enum 映射为 select，label 取 String(value)', () => {
        expect(describeProperty({ type: 'string', enum: ['a', 'b'] })).toMatchObject({
            kind: 'select',
            options: [
                { label: 'a', value: 'a' },
                { label: 'b', value: 'b' },
            ],
        });
        expect(describeProperty({ enum: [1, true] }).options).toEqual([
            { label: '1', value: 1 },
            { label: 'true', value: true },
        ]);
    });

    it('oneOf 的每一项都有 const 时映射为 select，label 取 title', () => {
        expect(describeProperty({ oneOf: [{ const: 'a', title: '甲' }, { const: 'b' }] })).toMatchObject({
            kind: 'select',
            options: [
                { label: '甲', value: 'a' },
                { label: 'b', value: 'b' },
            ],
        });
        expect(describeProperty({ anyOf: [{ const: 1 }, { const: 2 }] }).kind).toBe('select');
    });

    it('只有部分分支有 const 时不是 select', () => {
        expect(describeProperty({ oneOf: [{ const: 'a' }, { type: 'string' }] }).kind).toBe('unsupported');
    });

    it('options 的值含对象时不是 select', () => {
        expect(describeProperty({ enum: [{ a: 1 }] }).kind).toBe('unsupported');
    });

    it('枚举数组映射为多选 select，选项来自 items', () => {
        expect(describeProperty({ type: 'array', items: { enum: ['a', 'b'] }, minItems: 1 })).toMatchObject({
            kind: 'select',
            multiple: true,
            options: [
                { label: 'a', value: 'a' },
                { label: 'b', value: 'b' },
            ],
            minItems: 1,
        });
        expect(describeProperty({ type: 'array', items: { oneOf: [{ const: 1, title: '一' }, { const: 2 }] } }).options).toEqual([
            { label: '一', value: 1 },
            { label: '2', value: 2 },
        ]);
    });
});

describe('describeSchemaField array 与 object', () => {
    it('array 带出 minItems 与 maxItems', () => {
        expect(describeProperty({ type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 })).toMatchObject({ kind: 'array', minItems: 1, maxItems: 3, fixed: false });
        expect(describeProperty({ type: 'array', items: { type: 'string' } }).fixed).toBe(false);
    });

    it('minItems 等于 maxItems 时 fixed', () => {
        expect(describeProperty({ type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 2 }).fixed).toBe(true);
        expect(describeProperty({ type: 'array', items: { type: 'string' }, minItems: 0, maxItems: 0 }).fixed).toBe(true);
    });

    it('object 的 children 按 properties 声明顺序，required 来自 required 数组', () => {
        const node = describeSchemaField({ type: 'object', properties: { z: { type: 'string' }, a: { type: 'number', title: 'A' }, m: { type: 'boolean' } }, required: ['a'] });
        expect(node.kind).toBe('object');
        expect(node.children.map(({ key, kind, field, title, required }) => ({ key, kind, field, title, required }))).toEqual([
            { key: 'z', kind: 'input', field: 'z', title: 'z', required: false },
            { key: 'a', kind: 'number', field: 'a', title: 'A', required: true },
            { key: 'm', kind: 'switch', field: 'm', title: 'm', required: false },
        ]);
    });

    it('嵌套 object 的 children 带完整路径，非标识符的属性名用方括号', () => {
        const node = describeSchemaField({
            type: 'object',
            properties: { user: { type: 'object', properties: { 'first-name': { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } } } },
        });
        expect(node.children[0].children.map((child) => child.field)).toEqual(['user["first-name"]', 'user.tags']);
        expect(describeSchemaField(node.schema, 'user["first-name"]').key).toBe('first-name');
    });

    it('description、default 与 schema 原样带出', () => {
        const property = { type: 'string', description: '说明', default: 'x' };
        const node = describeProperty(property);
        expect(node).toMatchObject({ description: '说明', default: 'x' });
        expect(node.schema).toEqual(property);
    });
});

describe('describeSchemaField 节点解析', () => {
    it('type 数组里的 null 被去掉', () => {
        expect(describeProperty({ type: ['string', 'null'], maxLength: 5 })).toMatchObject({ kind: 'input', maxLength: 5 });
        expect(describeProperty({ type: ['string', 'null'] }).schema.type).toBe('string');
    });

    it('anyOf 与 oneOf 去掉 null 分支后只剩一项就展开，外层 title、description、default 优先', () => {
        const anyOf = describeProperty({ title: '外', default: 'o', anyOf: [{ type: 'string', title: '内', description: '内说明', default: 'i' }, { type: 'null' }] });
        expect(anyOf).toMatchObject({ kind: 'input', title: '外', description: '内说明', default: 'o' });
        expect(describeProperty({ oneOf: [{ type: 'null' }, { type: 'integer' }] })).toMatchObject({ kind: 'number', integer: true });
    });

    it('可空的枚举展开成 select', () => {
        expect(describeProperty({ anyOf: [{ const: 'a' }, { const: 'b' }, { type: 'null' }] }).kind).toBe('select');
        expect(describeProperty({ anyOf: [{ type: 'string', enum: ['a'] }, { type: 'null' }] }).kind).toBe('select');
    });

    it('本地 $ref 展开，含 $defs 与 definitions，外层 title 优先', () => {
        const root = { $defs: { Name: { type: 'string', title: '名', maxLength: 3 } }, definitions: { Age: { type: 'integer' } } };
        expect(describeProperty({ $ref: '#/$defs/Name', title: '姓名' }, root)).toMatchObject({ kind: 'input', title: '姓名', maxLength: 3 });
        expect(describeProperty({ $ref: '#/definitions/Age' }, root).kind).toBe('number');
    });

    it('$ref 链与 JSON Pointer 转义', () => {
        const root = { $defs: { 'a/b': { $ref: '#/$defs/c~0d' }, 'c~d': { type: 'boolean' } } };
        expect(describeProperty({ $ref: '#/$defs/a~1b' }, root).kind).toBe('switch');
    });

    it('同一个 $ref 在路径上重复出现视为递归，递归节点为 unsupported', () => {
        const root = {
            $defs: { Node: { type: 'object', properties: { name: { type: 'string' }, next: { $ref: '#/$defs/Node' } } } },
            $ref: '#/$defs/Node',
        };
        const node = describeSchemaField(root);
        expect(node.kind).toBe('object');
        expect(node.children.map(({ kind }) => kind)).toEqual(['input', 'unsupported']);
        expect(describeSchemaField(root, 'next').kind).toBe('unsupported');
    });

    it('指向根的递归 $ref 只展开一层', () => {
        const root = { type: 'object', properties: { child: { $ref: '#' } } };
        const child = describeSchemaField(root).children[0];
        expect(child.kind).toBe('object');
        expect(child.children[0].kind).toBe('unsupported');
    });

    it('同一个 $ref 在兄弟字段里重复出现不算递归', () => {
        const root = { $defs: { Name: { type: 'string' } }, type: 'object', properties: { a: { $ref: '#/$defs/Name' }, b: { $ref: '#/$defs/Name' } } };
        expect(describeSchemaField(root).children.map(({ kind }) => kind)).toEqual(['input', 'input']);
    });

    it('外部 $ref 为 unsupported，指向不存在的本地 $ref 抛错', () => {
        expect(describeProperty({ $ref: 'https://example.com/a.json' }).kind).toBe('unsupported');
        expect(() => describeProperty({ $ref: '#/$defs/missing' })).toThrow('#/$defs/missing');
    });
});

describe('describeSchemaField 路径', () => {
    const root: JsonSchema = {
        title: 'Root',
        type: 'object',
        required: ['contacts'],
        properties: {
            contacts: {
                type: 'array',
                items: { title: 'Contact', type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' }, phones: { type: 'array', items: { type: 'string' } } } },
            },
        },
    };

    it('空路径与省略路径返回根节点', () => {
        expect(describeSchemaField(root)).toMatchObject({ kind: 'object', field: '', pattern: '', key: '', title: 'Root', required: false });
        expect(describeSchemaField(root, '')).toMatchObject({ field: '', key: '' });
        expect(describeSchemaField({ type: 'object', properties: {} }).title).toBeUndefined();
    });

    it('按对象与数组逐段走，pattern 把下标换成 []', () => {
        expect(describeSchemaField(root, 'contacts[2].email')).toMatchObject({ kind: 'input', field: 'contacts[2].email', pattern: 'contacts[].email', key: 'email', title: 'email', required: true, format: 'email' });
        expect(describeSchemaField(root, 'contacts[0].phones[10]')).toMatchObject({ kind: 'input', pattern: 'contacts[].phones[]', key: 10 });
    });

    it('数组项节点的 key 是下标，title 只取 items 的 title，required 为 false', () => {
        expect(describeSchemaField(root, 'contacts[3]')).toMatchObject({ kind: 'object', key: 3, title: 'Contact', required: false });
        expect(describeSchemaField(root, 'contacts[0].phones[0]')).toMatchObject({ key: 0, title: undefined, required: false });
        expect(describeSchemaField(root, 'contacts').required).toBe(true);
    });

    it('数组项是对象时带出 children', () => {
        expect(describeSchemaField(root, 'contacts[1]').children.map(({ field }) => field)).toEqual(['contacts[1].email', 'contacts[1].phones']);
    });

    it('路径经过 $ref 的对象与数组', () => {
        const withRef = { $defs: { Row: { type: 'object', properties: { n: { type: 'number' } } } }, type: 'object', properties: { rows: { type: 'array', items: { $ref: '#/$defs/Row' } } } };
        expect(describeSchemaField(withRef, 'rows[0].n')).toMatchObject({ kind: 'number', pattern: 'rows[].n' });
    });

    it.each([['missing'], ['contacts.email'], ['contacts[0].missing'], ['contacts[0].email.deeper'], ['contacts[0].phones.x']])('路径 %s 不在 schema 里时抛错并带上路径', (field) => {
        expect(() => describeSchemaField(root, field)).toThrow(field);
    });
});

describe('blankRow', () => {
    const rows = (items: JsonSchema, minItems?: number) => ({ type: 'object', properties: { rows: { type: 'array', items, minItems } } });
    const blank = (root: JsonSchema) => blankRow(root, describeSchemaField(root, 'rows'));

    it('对象行为 {}，必填的嵌套对象与数组预填，选填的跳过', () => {
        const root = rows({
            type: 'object',
            required: ['name', 'address', 'phones', 'tags'],
            properties: {
                name: { type: 'string' },
                nick: { type: 'string' },
                address: { type: 'object', required: ['geo'], properties: { city: { type: 'string' }, geo: { type: 'object', properties: {} } } },
                phones: { type: 'array', items: { type: 'string' } },
                tags: { type: 'array', items: { enum: ['a'] } },
                note: { type: 'object', properties: {} },
            },
        });
        expect(blank(root)).toEqual({ address: { geo: {} }, phones: [], tags: [] });
    });

    it('嵌套数组按 minItems 预填空行', () => {
        const root = rows({
            type: 'object',
            required: ['phones', 'members'],
            properties: { phones: { type: 'array', items: { type: 'string' }, minItems: 2 }, members: { type: 'array', minItems: 1, items: { type: 'object', required: ['tags'], properties: { tags: { type: 'array', items: { type: 'string' } } } } } },
        });
        expect(blank(root)).toEqual({ phones: [undefined, undefined], members: [{ tags: [] }] });
    });

    it('非对象行为 undefined', () => {
        expect(blank(rows({ type: 'string' }))).toBeUndefined();
        expect(blank(rows({ type: 'number' }))).toBeUndefined();
    });

    it('行是 $ref，递归的必填引用不会无限展开', () => {
        const root = {
            $defs: { Row: { type: 'object', required: ['sub'], properties: { sub: { type: 'array', minItems: 1, items: { $ref: '#/$defs/Row' } } } } },
            type: 'object',
            properties: { rows: { type: 'array', items: { $ref: '#/$defs/Row' } } },
        };
        expect(blank(root)).toEqual({ sub: [undefined] });
    });
});

describe('resolveJsonSchema', () => {
    const schema = {
        '~standard': {
            version: 1,
            vendor: 'test',
            validate: () => ({ value: 1 }),
            jsonSchema: {
                input: ({ target }) => ({ type: 'string', target }),
                output: () => ({}),
            },
        },
    } as StandardSchema;

    it('显式的 jsonSchema 优先', () => {
        const explicit = { type: 'number' };
        expect(resolveJsonSchema(explicit, schema)).toBe(explicit);
        expect(resolveJsonSchema(explicit, undefined)).toBe(explicit);
    });

    it('否则取 Standard JSON Schema 的 input，目标为 draft-2020-12', () => {
        expect(resolveJsonSchema(undefined, schema)).toEqual({ type: 'string', target: 'draft-2020-12' });
    });

    it('两者都没有时返回 undefined', () => {
        expect(resolveJsonSchema(undefined, undefined)).toBeUndefined();
        expect(resolveJsonSchema(undefined, { '~standard': { version: 1, vendor: 'test', validate: () => ({ value: 1 }) } })).toBeUndefined();
    });

    it('导出抛错时不吞掉', () => {
        expect(() => resolveJsonSchema(undefined, z.object({ date: z.date() }))).toThrow('Date cannot be represented');
    });
});

describe('zod 导出的 JSON Schema', () => {
    const schema = z.object({
        name: z.string().max(10),
        age: z.number().int().min(0).optional(),
        tags: z.array(z.enum(['a', 'b'])),
        contacts: z.array(z.object({ email: z.email() })).min(1),
        nick: z.string().nullable(),
        role: z.string().default('guest'),
    });

    it('zod 实现了 Standard JSON Schema', () => {
        expect(resolveJsonSchema(undefined, schema)).toMatchObject({ type: 'object' });
    });

    it('describeSchemaField 能读出关键字段', () => {
        const root = resolveJsonSchema(undefined, schema);
        expect(describeSchemaField(root).children.map(({ key, kind, required }) => ({ key, kind, required }))).toEqual([
            { key: 'name', kind: 'input', required: true },
            { key: 'age', kind: 'number', required: false },
            { key: 'tags', kind: 'select', required: true },
            { key: 'contacts', kind: 'array', required: true },
            { key: 'nick', kind: 'input', required: true },
            { key: 'role', kind: 'input', required: false },
        ]);
        expect(describeSchemaField(root, 'name')).toMatchObject({ maxLength: 10 });
        expect(describeSchemaField(root, 'age')).toMatchObject({ integer: true, minimum: 0 });
        expect(describeSchemaField(root, 'tags')).toMatchObject({ multiple: true, options: [{ value: 'a' }, { value: 'b' }] });
        expect(describeSchemaField(root, 'contacts')).toMatchObject({ minItems: 1, fixed: false });
        expect(describeSchemaField(root, 'contacts[0].email')).toMatchObject({ kind: 'input', format: 'email', pattern: 'contacts[].email', required: true });
        expect(describeSchemaField(root, 'role')).toMatchObject({ default: 'guest' });
        expect(blankRow(root, describeSchemaField(root, 'contacts'))).toEqual({});
    });
});
