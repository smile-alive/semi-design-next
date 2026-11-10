import { createRawSnippet } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import * as z from 'zod';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import { createStore } from '@fibrae/semi-ui-svelte/__tests__/store.svelte';
import semiGlobal from '@fibrae/semi-ui-svelte/utils/semi-global';
import FormCheckbox from '../fields/form-checkbox.svelte';
import FormTextArea from '../fields/form-text-area.svelte';
import type { FormApi, SchemaFieldRenderProps } from '../interface';
import SchemaField from '../schema-form/schema-field.svelte';
import { settle, typeInto } from './helpers';
import SchemaFixture, { type SchemaFixtureStore } from './schema-fixture.svelte';

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
    return { ...view, store, api: () => formApi as FormApi };
}

const fieldOf = (path: string) => document.querySelector<HTMLElement>(`.semi-form-field[x-field-id="${path}"]`) as HTMLElement;
const button = (name: string) => screen.getByRole('button', { name });
const itemName = (key: 'item' | 'removeItem' | 'moveUpItem' | 'moveDownItem', index: number) => ja_JP.Form[key].replace('${index}', String(index + 1));

async function click(name: string) {
    await fireEvent.click(button(name));
    await settle();
}

const noteRenderer = createRawSnippet<[SchemaFieldRenderProps]>((props) => ({ render: () => `<div data-testid="custom">${props().field}</div>` }));

describe('Svelte SchemaField', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('根对象不包 Section，按类型渲染内建控件，label 取 title 或属性名，必填来自 required', () => {
        const schema = z.object({
            name: z.string().meta({ title: 'Name', description: 'your name' }),
            age: z.number().int().min(0).max(9),
            vip: z.boolean().optional(),
            level: z.enum(['a', 'b']),
            bio: z.string().max(200).optional(),
        });
        const { container } = renderSchema({ formProps: { schema } });
        expect(container.querySelector('.semi-form-section')).toBeNull();
        expect(fieldOf('name').querySelector('input.semi-input')).not.toBeNull();
        expect(fieldOf('name').querySelector('.semi-form-field-label')).toHaveTextContent('Name');
        expect(fieldOf('name').querySelector('.semi-form-field-label')).toHaveClass('semi-form-field-label-required');
        expect(fieldOf('name')).toHaveTextContent('your name');
        expect(fieldOf('age').querySelector('.semi-input-number')).not.toBeNull();
        expect(fieldOf('vip').querySelector('[role="switch"]')).not.toBeNull();
        expect(fieldOf('vip').querySelector('.semi-form-field-label')).toHaveTextContent('vip');
        expect(fieldOf('vip').querySelector('.semi-form-field-label')).not.toHaveClass('semi-form-field-label-required');
        expect(fieldOf('level').querySelector('.semi-select')).not.toBeNull();
        expect(fieldOf('bio').querySelector('textarea')).not.toBeNull();
    });

    it('嵌套对象渲染为 Section，field 只渲染指定子树', async () => {
        const schema = z.object({ name: z.string(), address: z.object({ city: z.string() }).meta({ title: 'Address' }) });
        const { container, store } = renderSchema({ formProps: { schema } });
        expect(container.querySelector('.semi-form-section-text')).toHaveTextContent('Address');
        expect(fieldOf('address.city')).not.toBeNull();
        store.fieldProps = { field: 'address' };
        await settle();
        expect(fieldOf('name')).toBeNull();
        expect(fieldOf('address.city')).not.toBeNull();
    });

    it('widgets 按 format 优先于按 kind，renderField 按 pattern 覆盖数组项内的字段', async () => {
        const schema = z.object({ site: z.url(), on: z.boolean(), tags: z.array(z.object({ name: z.string(), note: z.string() })) });
        renderSchema({ formProps: { schema, initValues: { tags: [{ name: 'x' }] } }, fieldProps: { widgets: { uri: FormTextArea, switch: FormCheckbox }, renderField: { 'tags[].note': noteRenderer } } });
        await settle();
        expect(fieldOf('site').querySelector('textarea')).not.toBeNull();
        expect(fieldOf('on').querySelector('.semi-checkbox')).not.toBeNull();
        expect(screen.getByTestId('custom')).toHaveTextContent('tags[0].note');
        expect(fieldOf('tags[0].note')).toBeNull();
    });

    it('数组行的按钮取 ja_JP 可访问名称，按 minItems 与 maxItems 禁用，新增、移动与删除改写值', async () => {
        const schema = z.object({
            items: z
                .array(z.object({ name: z.string() }))
                .min(1)
                .max(2),
        });
        const { api, container } = renderSchema({ formProps: { schema, initValues: { items: [{ name: 'a' }] } } });
        await settle();
        expect(button(itemName('moveUpItem', 0))).toBeDisabled();
        expect(button(itemName('moveDownItem', 0))).toBeDisabled();
        expect(button(itemName('removeItem', 0))).toBeDisabled();
        await click(ja_JP.Form.addItem);
        expect(button(ja_JP.Form.addItem)).toBeDisabled();
        expect(api().getValue('items')).toEqual([{ name: 'a' }, {}]);
        expect([...container.querySelectorAll('.semi-form-section-text')].map((node) => node.textContent)).toEqual(['items', itemName('item', 0), itemName('item', 1)]);
        await typeInto(fieldOf('items[1].name').querySelector('input') as HTMLInputElement, 'b');
        await click(itemName('moveDownItem', 0));
        expect(api().getValue('items')).toEqual([{ name: 'b' }, { name: 'a' }]);
        await click(itemName('removeItem', 1));
        expect(api().getValue('items')).toEqual([{ name: 'b' }]);
        expect(button(ja_JP.Form.addItem)).toBeEnabled();
    });

    it('minItems 等于 maxItems 时不显示新增与删除按钮', async () => {
        renderSchema({ formProps: { schema: z.object({ pair: z.array(z.string()).length(2) }), initValues: { pair: ['a', 'b'] } } });
        await settle();
        expect(screen.queryByRole('button', { name: ja_JP.Form.addItem })).toBeNull();
        expect(screen.queryByRole('button', { name: itemName('removeItem', 0) })).toBeNull();
        expect(button(itemName('moveDownItem', 0))).toBeEnabled();
        expect(fieldOf('pair[1]').querySelector('.semi-form-field-label')).toHaveTextContent(itemName('item', 1));
    });

    it('没有控件可用的节点发出警告，给出 renderField 后不再警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const jsonSchema = { type: 'object', properties: { empty: { type: 'null' } } };
        const view = renderSchema({ fieldProps: { jsonSchema } });
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('"empty"'));
        view.unmount();
        warn.mockClear();
        renderSchema({ fieldProps: { jsonSchema, renderField: { empty: noteRenderer } } });
        expect(warn).not.toHaveBeenCalled();
        expect(screen.getByTestId('custom')).toHaveTextContent('empty');
    });

    it('没有 JSON Schema 时警告且不渲染', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const { container } = renderSchema({});
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('no JSON Schema'));
        expect(container.querySelector('.semi-form-field')).toBeNull();
    });

    it('在 Form 外使用时抛错', () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        expect(() => render(SchemaField, { props: { jsonSchema: { type: 'string' } } })).toThrow('inside <Form>');
    });

    it('从 semiGlobal overrideDefaultProps 读取 SchemaField 的 widgets', () => {
        semiGlobal.config.overrideDefaultProps = { SchemaField: { widgets: { uri: FormTextArea } } };
        renderSchema({ formProps: { schema: z.object({ site: z.url() }) } });
        expect(fieldOf('site').querySelector('textarea')).not.toBeNull();
    });
});

describe('Svelte SchemaForm', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('按 schema 渲染字段，children 跟在字段之后，提交时 onSubmit 拿到 schema 的输出', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const { api, container } = renderSchema({ asForm: true, formProps: { schema: z.object({ name: z.string().trim() }), onSubmit } });
        const form = container.querySelector('form') as HTMLFormElement;
        expect(form.lastElementChild).toHaveAttribute('type', 'submit');
        await typeInto(fieldOf('name').querySelector('input') as HTMLInputElement, ' a ');
        await fireEvent.click(screen.getByRole('button', { name: 'submit' }));
        await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit.mock.calls[0][0]).toEqual({ name: 'a' });
        expect(api().getValue('name')).toBe(' a ');
    });

    it('从 semiGlobal overrideDefaultProps 读取 SchemaForm 自身的属性，Form 的属性仍读 Form 的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { SchemaForm: { widgets: { uri: FormTextArea } }, Form: { layout: 'horizontal' } };
        const { container } = renderSchema({ asForm: true, formProps: { schema: z.object({ site: z.url() }) } });
        expect(fieldOf('site').querySelector('textarea')).not.toBeNull();
        expect(container.querySelector('form')).toHaveClass('semi-form-horizontal');
    });
});
