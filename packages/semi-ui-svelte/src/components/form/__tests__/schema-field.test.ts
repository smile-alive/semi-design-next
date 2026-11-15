import { fireEvent, render, screen } from '@testing-library/svelte';
import scrollIntoView from 'scroll-into-view-if-needed';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import * as z from 'zod';
import { createStore } from '@fibrae/semi-ui-svelte/__tests__/store.svelte';
import { en_US } from '@fibrae/semi-ui-svelte/locale';
import { semiGlobal } from '@fibrae/semi-ui-svelte/utils';
import { getElement } from '@test/utils/dom/common';
import type { FormApi } from '../interface';
import SchemaField from '../schema-form/schema-field.svelte';
import { semiRenderers } from '../schema-form/semi-renderers.svelte';
import { settle, typeInto } from './helpers';
import SchemaAddFixture from './schema-add-fixture.svelte';
import SchemaFixture, { type SchemaFixtureStore } from './schema-fixture.svelte';
import SchemaHooksFixture from './schema-hooks-fixture.svelte';
import SchemaReplaceFixture from './schema-replace-fixture.svelte';
import SchemaRevealFixture from './schema-reveal-fixture.svelte';

vi.mock('scroll-into-view-if-needed', () => ({ default: vi.fn<() => void>() }));

function renderSchema(options: SchemaFixtureStore) {
    const store = createStore<SchemaFixtureStore>(options);
    let formApi: FormApi | undefined;
    const view = render(SchemaFixture, {
        props: {
            store,
            onApi: (api: FormApi) => {
                formApi = api;
            },
        },
    });
    return { ...view, store, api: () => formApi! };
}

function renderWithApi(fixture: typeof SchemaHooksFixture) {
    let formApi: FormApi | undefined;
    const view = render(fixture, {
        props: {
            onApi: (api: FormApi) => {
                formApi = api;
            },
        },
    });
    return { ...view, api: () => formApi! };
}

const fieldOf = (path: string) => getElement(`.semi-form-field[x-field-id="${path}"]`);
const queryField = (path: string) => document.querySelector(`.semi-form-field[x-field-id="${path}"]`);
const button = (name: string) => screen.getByRole('button', { name });
const itemName = (key: 'item' | 'removeItem' | 'moveUpItem' | 'moveDownItem', index: number) => en_US.Form[key].replace('${index}', String(index + 1));
const arrayItemName = (title: string, index: number) => en_US.Form.arrayItem.replace('${title}', title).replace('${index}', String(index + 1));
const info = (testId: string) => JSON.parse(screen.getByTestId(testId).dataset.info!);

async function click(name: string) {
    await fireEvent.click(button(name));
    await settle();
}

describe('Svelte SchemaField', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('按 JSON Schema 的类型渲染内置控件，标题、说明、必填与默认值取自 schema', () => {
        const { container, api } = renderSchema({
            fieldProps: {
                jsonSchema: {
                    type: 'object',
                    required: ['name'],
                    properties: {
                        name: { type: 'string', title: 'Name', description: 'your name', maxLength: 20, default: 'semi' },
                        bio: { type: 'string', maxLength: 500 },
                        age: { type: 'integer', minimum: 0, maximum: 150 },
                        vip: { type: 'boolean' },
                        role: { enum: ['admin', 'user'] },
                        tags: { type: 'array', items: { enum: ['a', 'b'] } },
                        address: { type: 'object', title: 'Address', properties: { city: { type: 'string' } } },
                    },
                },
            },
        });
        expect(screen.getByRole('textbox', { name: /Name/ })).toHaveValue('semi');
        expect(screen.getByRole('textbox', { name: /Name/ })).toHaveAttribute('maxlength', '20');
        expect(fieldOf('name').querySelector('.semi-form-field-label')).toHaveClass('semi-form-field-label-required');
        expect(fieldOf('name')).toHaveTextContent('your name');
        expect(fieldOf('bio').querySelector('textarea')).not.toBeNull();
        expect(fieldOf('bio')).toHaveTextContent('0/500');
        expect(fieldOf('age').querySelector('.semi-input-number')).not.toBeNull();
        expect(screen.getByRole('spinbutton', { name: 'age' })).toHaveAttribute('aria-valuemax', '150');
        expect(fieldOf('vip').querySelector('[role="switch"]')).not.toBeNull();
        expect(fieldOf('role').querySelector('.semi-select')).not.toBeNull();
        expect(fieldOf('tags').querySelector('.semi-select-multiple')).not.toBeNull();
        expect(screen.getByText('Address')).toBeInTheDocument();
        expect(fieldOf('address.city')).not.toBeNull();
        expect(container.querySelectorAll('.semi-form-field-label-required')).toHaveLength(1);
        expect(api().getValue('name')).toBe('semi');
    });

    it('根对象不包 Section，嵌套对象渲染为 Section，field 只渲染指定子树', async () => {
        const schema = z.object({ name: z.string(), address: z.object({ city: z.string() }).meta({ title: 'Address' }) });
        const { container, store } = renderSchema({ formProps: { schema } });
        expect(container.querySelectorAll('.semi-form-section')).toHaveLength(1);
        expect(container.querySelector('.semi-form-section-text')).toHaveTextContent('Address');
        expect(fieldOf('address.city')).not.toBeNull();
        store.fieldProps = { field: 'address' };
        await settle();
        expect(queryField('name')).toBeNull();
        expect(fieldOf('address.city')).not.toBeNull();
    });

    it('renderers 替换某一类节点的渲染，renderField 按 pattern 覆盖单个节点', async () => {
        render(SchemaReplaceFixture);
        await settle();
        expect(screen.queryByRole('textbox', { name: 'hidden' })).toBeNull();
        expect(screen.getByText('email email')).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'note' })).toBeInTheDocument();
        expect(screen.getByText('custom items[0].label input')).toBeInTheDocument();
    });

    it('不传 renderers 时只渲染对象的属性，叶子与数组不渲染并警告；缺少 JSON Schema 时警告', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const jsonSchema = { type: 'object', properties: { name: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } } };
        const { container, store } = renderSchema({ fieldProps: { jsonSchema, renderers: undefined } });
        await settle();
        expect(getElement<HTMLFormElement>('form', container).children).toHaveLength(0);
        expect(warn).toHaveBeenCalledWith('Warning: [Semi Form] SchemaField renders nothing for "name": renderers has no field entry');
        expect(warn).toHaveBeenCalledWith('Warning: [Semi Form] SchemaField renders nothing for "tags": renderers has no array entry');
        store.fieldProps = { jsonSchema: { type: 'object', properties: { blob: {} } } };
        await settle();
        expect(warn).toHaveBeenCalledWith('Warning: [Semi Form] SchemaField renders nothing for "blob": its schema maps to no control');
        store.fieldProps = {};
        await settle();
        expect(warn).toHaveBeenCalledWith('Warning: [Semi Form] SchemaField has no JSON Schema: pass jsonSchema, or give the Form a schema that exports one');
        warn.mockRestore();
    });

    it('jsonSchema 缺省时从 Form schema 导出', () => {
        renderSchema({ formProps: { schema: z.object({ name: z.string(), count: z.number() }) } });
        expect(screen.getByRole('textbox', { name: /name/ })).toBeInTheDocument();
        expect(screen.getByRole('spinbutton', { name: /count/ })).toBeInTheDocument();
    });

    it('数组可以增删与移动行，按 minItems、maxItems 与首末行禁用按钮', async () => {
        const jsonSchema = { type: 'object', properties: { tags: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 } } };
        const { api } = renderSchema({ formProps: { initValues: { tags: ['a', 'b'] } }, fieldProps: { jsonSchema } });
        await settle();
        expect(screen.getByRole('textbox', { name: arrayItemName('tags', 0) })).toHaveValue('a');
        expect(button(itemName('moveUpItem', 0))).toBeDisabled();
        expect(button(itemName('moveDownItem', 1))).toBeDisabled();
        await click(itemName('moveDownItem', 0));
        expect(api().getValue('tags')).toEqual(['b', 'a']);
        expect(screen.getByRole('textbox', { name: arrayItemName('tags', 0) })).toHaveValue('b');
        await click(en_US.Form.addItem);
        expect(screen.getAllByRole('textbox')).toHaveLength(3);
        expect(button(en_US.Form.addItem)).toBeDisabled();
        await click(itemName('removeItem', 2));
        await click(itemName('removeItem', 1));
        expect(api().getValue('tags')).toEqual(['b']);
        expect(button(itemName('removeItem', 0))).toBeDisabled();
        expect(button(en_US.Form.addItem)).toBeEnabled();
    });

    it('对象数组的行渲染成带序号标题的 Section，新增行按 schema 预填', async () => {
        const jsonSchema = {
            type: 'object',
            properties: {
                contacts: { type: 'array', items: { type: 'object', required: ['phones'], properties: { email: { type: 'string' }, phones: { type: 'array', items: { type: 'string' }, minItems: 1 } } } },
            },
        };
        const { api, container } = renderSchema({ fieldProps: { jsonSchema } });
        await click(en_US.Form.addItem);
        expect(getElement('.semi-form-section-text', getElement('.semi-form-section .semi-form-section'))).toHaveTextContent(itemName('item', 0));
        expect(container.querySelector('.semi-form-section-text')).toHaveTextContent('contacts');
        expect(screen.getByRole('textbox', { name: 'email' })).toBeInTheDocument();
        expect(api().getValue('contacts')).toEqual([{ phones: [undefined] }]);
    });

    it('minItems 等于 maxItems 时行数固定，不显示新增与删除按钮', async () => {
        renderSchema({ formProps: { schema: z.object({ pair: z.array(z.string()).length(2) }), initValues: { pair: ['a', 'b'] } } });
        await settle();
        expect(screen.queryByRole('button', { name: en_US.Form.addItem })).toBeNull();
        expect(screen.queryByRole('button', { name: itemName('removeItem', 0) })).toBeNull();
        expect(button(itemName('moveDownItem', 0))).toBeEnabled();
        expect(screen.getByRole('textbox', { name: arrayItemName('pair', 1) })).toHaveValue('b');
    });

    it('单值数组的行不显示标签与说明，以「数组标题 第 N 项」命名，说明合并到数组的 Section；对象项的字段照常显示标签', async () => {
        const jsonSchema = {
            type: 'object',
            properties: {
                body: { type: 'array', title: 'Body', description: 'One paragraph each.', items: { type: 'string', title: 'Paragraph', description: 'Plain text' } },
                counts: { type: 'array', items: { type: 'number' } },
                flags: { type: 'array', items: { type: 'boolean' } },
                contacts: { type: 'array', items: { type: 'object', properties: { email: { type: 'string' }, phones: { type: 'array', items: { type: 'string' } } } } },
            },
        };
        renderSchema({ formProps: { initValues: { body: ['p1', 'p2'], counts: [1], flags: [true], contacts: [{ email: 'e', phones: ['x'] }] } }, fieldProps: { jsonSchema } });
        await settle();
        expect(screen.getByRole('textbox', { name: arrayItemName('Body', 0) })).toHaveValue('p1');
        expect(screen.getByRole('textbox', { name: arrayItemName('Body', 1) })).toHaveValue('p2');
        expect(fieldOf('body[0]').querySelector('label')).toBeNull();
        expect(document.querySelector('.semi-form-schema-array-row-single')).not.toBeNull();
        expect(screen.queryByText('Paragraph')).toBeNull();
        expect(screen.queryByText('Plain text')).toBeNull();
        expect(screen.getByRole('group', { name: 'Body' })).toHaveAccessibleDescription('One paragraph each.');
        expect(screen.getByRole('spinbutton', { name: arrayItemName('counts', 0) })).toHaveValue('1');
        expect(screen.getByRole('switch', { name: arrayItemName('flags', 0) })).toBeChecked();
        expect(screen.getByRole('textbox', { name: 'email' })).toHaveValue('e');
        expect(screen.getByRole('textbox', { name: arrayItemName('phones', 0) })).toHaveValue('x');
    });

    it('钩子交出节点信息：层级、说明、单值项的序号与所属数组，数组的行、条数、上下限与数组级错误', async () => {
        const { api } = renderWithApi(SchemaHooksFixture);
        await settle();
        expect(info('object:profile')).toMatchObject({ depth: 1, description: 'Profile' });
        expect(info('field:profile.name')).toMatchObject({ depth: 2 });
        expect(info('field:body[0]')).toMatchObject({ depth: 2, title: 'Para', description: 'One paragraph', item: { index: 0, arrayTitle: 'Body', arrayKey: 'body' } });
        expect(info('array')).toMatchObject({
            count: 1,
            minItems: 1,
            maxItems: 2,
            canAdd: true,
            canRemove: false,
            fixed: false,
            description: 'Paragraphs',
            fieldProps: { 'x-field-id': 'body' },
            items: [{ field: 'body[0]', index: 0, value: 'p1' }],
        });
        expect(screen.getByRole('textbox', { name: 'body[0]' })).toHaveValue('p1');
        api().setError('body', 'too few');
        await settle();
        expect(info('array').error).toEqual(['too few']);
        await typeInto(screen.getByRole('textbox', { name: 'body[0]' }), 'p2');
        expect(info('array').items[0].value).toBe('p2');
        await click('add');
        expect(info('array')).toMatchObject({ count: 2, canAdd: false });
        expect(info('array').items).toHaveLength(2);
    });

    it('数组的 add 默认按 schema 生成新行，点击事件不当作插入位置', async () => {
        const { api } = renderWithApi(SchemaAddFixture);
        await click('add');
        expect(api().getValue('rows')).toEqual([{ tags: ['a'] }, { tags: [] }]);
    });

    it('focusField 先请调用方展开折叠的卡片，挂载后聚焦卡片里的控件', async () => {
        const { api } = renderWithApi(SchemaRevealFixture);
        await settle();
        expect(screen.getByRole('region', { name: 'Ann' })).toBeEmptyDOMElement();
        await api().focusField('contacts[0].email');
        expect(screen.getByRole('textbox', { name: 'email' })).toHaveFocus();
    });

    it('scrollToField 对数组路径滚动到预设渲染的 Section', async () => {
        const jsonSchema = { type: 'object', properties: { tags: { type: 'array', items: { type: 'string' } } } };
        const { api } = renderSchema({ fieldProps: { jsonSchema } });
        await api().scrollToField('tags');
        expect(scrollIntoView).toHaveBeenLastCalledWith(document.querySelector('fieldset[x-field-id="tags"]'), expect.anything());
    });

    it('在 Form 外使用时抛错', () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        expect(() => render(SchemaField, { props: { jsonSchema: { type: 'string' } } })).toThrow('inside <Form>');
    });

    it('从 semiGlobal overrideDefaultProps 读取 SchemaField 的 jsonSchema 与 renderers', () => {
        semiGlobal.config.overrideDefaultProps = { SchemaField: { jsonSchema: { type: 'object', properties: { name: { type: 'string' } } }, renderers: semiRenderers } };
        renderSchema({ fieldProps: { renderers: undefined } });
        expect(screen.getByRole('textbox', { name: 'name' })).toBeInTheDocument();
    });
});

describe('Svelte SchemaForm', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('按 schema 渲染字段，children 跟在字段之后，提交时 onSubmit 拿到 schema 的输出', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const { api, container } = renderSchema({ asForm: true, formProps: { schema: z.object({ name: z.string().trim() }), onSubmit } });
        const form = getElement<HTMLFormElement>('form', container);
        expect(form.lastElementChild).toHaveAttribute('type', 'submit');
        await typeInto(getElement<HTMLInputElement>('input', fieldOf('name')), ' a ');
        await fireEvent.click(screen.getByRole('button', { name: 'submit' }));
        await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit.mock.calls[0][0]).toEqual({ name: 'a' });
        expect(api().getValue('name')).toBe(' a ');
    });

    it('从 semiGlobal overrideDefaultProps 读取 SchemaForm 自身的属性，Form 的属性仍读 Form 的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { SchemaForm: { jsonSchema: { type: 'object', properties: { city: { type: 'string' } } }, renderers: semiRenderers }, Form: { layout: 'horizontal' } };
        const { container } = renderSchema({ asForm: true, formProps: { renderers: undefined } });
        expect(screen.getByRole('textbox', { name: 'city' })).toBeInTheDocument();
        expect(container.querySelector('form')).toHaveClass('semi-form-horizontal');
    });
});
