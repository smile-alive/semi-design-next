import { For, type JSX, Show, createSignal } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import * as z from 'zod';
import { en_US } from '@fibrae/semi-ui-solid/locale';
import { semiGlobal } from '@fibrae/semi-ui-solid/utils';
import { type FormApi, type SchemaArrayContext, type SchemaFieldContext, type SchemaFieldProps, Form, FormInput, SchemaField, SchemaForm, semiRenderers } from '..';
import Button from '../../button';
import LocaleProvider from '../../locale/locale-provider';

const profile = {
    type: 'object',
    required: ['name'],
    properties: {
        name: { type: 'string', title: 'Name', description: 'your name', maxLength: 20, default: 'semi' },
        bio: { type: 'string', title: 'Bio', maxLength: 500 },
        age: { type: 'integer', title: 'Age', minimum: 0, maximum: 150 },
        active: { type: 'boolean', title: 'Active' },
        role: { type: 'string', title: 'Role', enum: ['admin', 'user'] },
        tags: { type: 'array', title: 'Tags', items: { enum: ['a', 'b'] } },
        address: { type: 'object', title: 'Address', properties: { city: { type: 'string', title: 'City' } } },
    },
};

const contacts = (limits: { minItems?: number; maxItems?: number }) => ({
    type: 'object',
    properties: { contacts: { type: 'array', title: 'Contacts', ...limits, items: { type: 'object', properties: { email: { type: 'string', title: 'Email' } } } } },
});

const emails = () => screen.queryAllByRole('textbox', { name: 'Email' }).map((input) => (input as HTMLInputElement).value);

const inEnglish = (ui: () => JSX.Element) => render(() => <LocaleProvider locale={en_US}>{ui()}</LocaleProvider>);

function renderSchema(jsonSchema: Record<string, any>, initValues?: Record<string, any>, extra?: Partial<SchemaFieldProps>) {
    let api: FormApi | undefined;
    const result = inEnglish(() => (
        <Form getFormApi={(formApi) => (api = formApi)} initValues={initValues}>
            <SchemaField jsonSchema={jsonSchema} renderers={semiRenderers} {...extra} />
        </Form>
    ));
    return { ...result, api: () => api! };
}

describe('SchemaField', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('按节点类型渲染输入框、长文本、数字、开关、单选、多选与嵌套对象，标题、说明、必填与默认值取自 schema', () => {
        const { container, api } = renderSchema(profile);
        expect(screen.getByRole('textbox', { name: /Name/ })).toHaveValue('semi');
        expect(screen.getByRole('textbox', { name: /Name/ })).toHaveAttribute('maxlength', '20');
        expect(screen.getByText('your name')).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'Bio' }).tagName).toBe('TEXTAREA');
        expect(screen.getByRole('spinbutton', { name: 'Age' })).toBeInTheDocument();
        expect(screen.getByRole('switch', { name: 'Active' })).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: 'Role' })).toBeInTheDocument();
        expect(container.querySelector('.semi-form-field[x-field-id="tags"] .semi-select-multiple')).not.toBeNull();
        expect(screen.getByText('Address')).toBeInTheDocument();
        expect(container.querySelector('[x-field-id="address.city"]')).toContainElement(screen.getByRole('textbox', { name: 'City' }));
        expect([...container.querySelectorAll('.semi-form-field-label-required')].map((label) => label.textContent)).toEqual(['Name']);
        expect(api().getValue('name')).toBe('semi');
    });

    it('field 只渲染该路径的节点，非根对象包在 Section 里', () => {
        renderSchema(profile, undefined, { field: 'address' });
        expect(screen.queryByRole('textbox', { name: /Name/ })).toBeNull();
        expect(screen.getByText('Address', { selector: '.semi-form-section-text' })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'City' })).toBeInTheDocument();
    });

    it('renderers 替换某一类节点的渲染，renderField 按 pattern 覆盖单个节点，返回 null 即隐藏', () => {
        renderSchema(
            {
                type: 'object',
                properties: {
                    email: { type: 'string', format: 'email' },
                    note: { type: 'string' },
                    secret: { type: 'string' },
                    items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' } } } },
                },
            },
            { items: [{ label: 'x' }] },
            {
                renderers: { ...semiRenderers, field: (context) => (context.node.format === 'email' ? <span>{`email ${context.node.field}`}</span> : semiRenderers.field(context)) },
                renderField: { 'items[].label': (context) => <span>{`custom ${context.node.field} ${context.node.kind}`}</span>, secret: () => null },
            }
        );
        expect(screen.queryByRole('textbox', { name: 'secret' })).toBeNull();
        expect(screen.getByText('email email')).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'note' })).toBeInTheDocument();
        expect(screen.getByText('custom items[0].label input')).toBeInTheDocument();
    });

    it('object 渲染器存在但返回空时不回退到属性', () => {
        const { container } = inEnglish(() => (
            <Form>
                <SchemaField jsonSchema={{ type: 'object', properties: { name: { type: 'string' } } }} renderers={{ ...semiRenderers, object: () => null }} />
            </Form>
        ));
        expect(container.querySelector('form')).toBeEmptyDOMElement();
    });

    it('不传 renderers 时只渲染对象的属性，叶子与数组不渲染并警告；不支持的 schema 与缺少 JSON Schema 时警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const warned = (text: string) => warn.mock.calls.some(([message]) => String(message).includes(text));
        const { container } = inEnglish(() => (
            <Form>
                <SchemaField jsonSchema={{ type: 'object', properties: { name: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } } }} />
            </Form>
        ));
        expect(container.querySelector('form')).toBeEmptyDOMElement();
        expect(warned('SchemaField renders nothing for "name": renderers has no field entry')).toBe(true);
        expect(warned('SchemaField renders nothing for "tags": renderers has no array entry')).toBe(true);
        renderSchema({ type: 'object', properties: { blob: {} } });
        expect(warned('SchemaField renders nothing for "blob": its schema maps to no control')).toBe(true);
        inEnglish(() => (
            <Form>
                <SchemaField />
            </Form>
        ));
        expect(warned('SchemaField has no JSON Schema: pass jsonSchema, or give the Form a schema that exports one')).toBe(true);
        warn.mockRestore();
    });

    it('jsonSchema 缺省时从 Form schema 导出', () => {
        inEnglish(() => (
            <Form schema={z.object({ name: z.string(), count: z.number() })}>
                <SchemaField renderers={semiRenderers} />
            </Form>
        ));
        expect(screen.getByRole('textbox', { name: /name/ })).toBeInTheDocument();
        expect(screen.getByRole('spinbutton', { name: /count/ })).toBeInTheDocument();
    });

    it('数组可以增删与移动行，按 minItems、maxItems 与首末行禁用按钮，可访问名称来自语言包', async () => {
        const user = userEvent.setup();
        const { api } = renderSchema(contacts({ minItems: 1, maxItems: 2 }), { contacts: [{ email: 'a' }] });
        const add = screen.getByRole('button', { name: 'Add item' });
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Remove item 1' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Move item 1 up' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Move item 1 down' })).toBeDisabled();
        await user.click(add);
        expect(emails()).toEqual(['a', '']);
        expect(add).toBeDisabled();
        await user.type(screen.getAllByRole('textbox', { name: 'Email' })[1], 'b');
        await user.click(screen.getByRole('button', { name: 'Move item 1 down' }));
        expect(emails()).toEqual(['b', 'a']);
        expect(api().getValue('contacts')).toEqual([{ email: 'b' }, { email: 'a' }]);
        await user.click(screen.getByRole('button', { name: 'Remove item 2' }));
        expect(emails()).toEqual(['b']);
        expect(add).not.toBeDisabled();
    });

    it('移动行时行的 DOM 原地换位，不重建', async () => {
        const user = userEvent.setup();
        renderSchema(contacts({}), { contacts: [{ email: 'a' }, { email: 'b' }] });
        const [first, second] = screen.getAllByRole('textbox', { name: 'Email' });
        await user.click(screen.getByRole('button', { name: 'Move item 1 down' }));
        expect(screen.getAllByRole('textbox', { name: 'Email' })).toEqual([second, first]);
        expect(emails()).toEqual(['b', 'a']);
    });

    it('对象数组的行渲染成带序号标题的 Section，新增行按 schema 预填', async () => {
        const user = userEvent.setup();
        const { api } = renderSchema({
            type: 'object',
            properties: {
                contacts: { type: 'array', items: { type: 'object', required: ['phones'], properties: { email: { type: 'string' }, phones: { type: 'array', items: { type: 'string' }, minItems: 1 } } } },
            },
        });
        await user.click(screen.getByRole('button', { name: 'Add item' }));
        expect(screen.getByText('Item 1', { selector: '.semi-form-section-text' })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'email' })).toBeInTheDocument();
        expect(api().getValue('contacts')).toEqual([{ phones: [undefined] }]);
    });

    it('semiRenderers：单值数组的行不显示标签与说明，以「数组标题 第 N 项」命名；对象项的字段照常显示标签', () => {
        const { container } = renderSchema(
            {
                type: 'object',
                properties: {
                    body: { type: 'array', title: 'Body', description: 'One paragraph each.', items: { type: 'string', title: 'Paragraph', description: 'Plain text' } },
                    counts: { type: 'array', items: { type: 'number' } },
                    flags: { type: 'array', items: { type: 'boolean' } },
                    contacts: { type: 'array', items: { type: 'object', properties: { email: { type: 'string' }, phones: { type: 'array', items: { type: 'string' } } } } },
                },
            },
            { body: ['p1', 'p2'], counts: [1], flags: [true], contacts: [{ email: 'e', phones: ['x'] }] }
        );
        expect(screen.getByRole('textbox', { name: 'Body item 1' })).toHaveValue('p1');
        expect(screen.getByRole('textbox', { name: 'Body item 2' })).toHaveValue('p2');
        expect(container.querySelector('[x-field-id="body[0]"] label')).toBeNull();
        expect(container.querySelector('.semi-form-schema-array-row-single')).not.toBeNull();
        expect(screen.queryByText('Plain text')).toBeNull();
        expect(screen.getByRole('group', { name: 'Body' })).toHaveAccessibleDescription('One paragraph each.');
        expect(screen.getByRole('spinbutton', { name: 'counts item 1' })).toHaveValue('1');
        expect(screen.getByRole('switch', { name: 'flags item 1' })).toBeChecked();
        expect(screen.getByRole('textbox', { name: 'email' })).toHaveValue('e');
        expect(screen.getByRole('textbox', { name: 'phones item 1' })).toHaveValue('x');
    });

    it('钩子交出节点信息：层级、说明、单值项的序号与所属数组；数组的行、条数、上下限与数组级错误随状态更新，首次拿到的上下文也是活的', () => {
        const seen: Record<string, SchemaFieldContext> = {};
        let array!: SchemaArrayContext;
        const { api } = renderSchema(
            {
                type: 'object',
                properties: {
                    profile: { type: 'object', description: 'Profile', properties: { name: { type: 'string' } } },
                    body: { type: 'array', title: 'Body', description: 'Paragraphs', minItems: 1, maxItems: 2, items: { type: 'string', title: 'Paragraph', description: 'One paragraph' } },
                },
            },
            { body: ['p1'] },
            {
                renderers: {
                    object: (context) => {
                        seen[context.node.field] = context;
                        return context.content;
                    },
                    array: (context) => {
                        array = context;
                        return (
                            <div {...context.fieldProps}>
                                <For each={context.items}>{(item) => <div>{context.render(() => item.field)}</div>}</For>
                            </div>
                        );
                    },
                    field: (context) => {
                        seen[context.node.field] = context;
                        return <FormInput aria-label={context.node.field} field={context.node.field} noLabel />;
                    },
                },
            }
        );
        expect(seen.profile.node).toMatchObject({ depth: 1, description: 'Profile' });
        expect(seen['profile.name'].node).toMatchObject({ depth: 2, item: undefined });
        expect(seen['body[0]'].node).toMatchObject({ depth: 2, title: 'Paragraph', description: 'One paragraph', item: { index: 0, arrayTitle: 'Body', arrayKey: 'body' } });
        expect(array).toMatchObject({ count: 1, minItems: 1, maxItems: 2, canAdd: true, canRemove: false, fixed: false, fieldProps: { 'x-field-id': 'body' } });
        expect(array.node.description).toBe('Paragraphs');
        expect(array.items[0]).toMatchObject({ field: 'body[0]', index: 0, value: 'p1' });
        expect(screen.getByRole('textbox', { name: 'body[0]' })).toHaveValue('p1');
        expect(array.error).toBeUndefined();
        api().setError('body', 'too few');
        expect(array.error).toEqual(['too few']);
        array.add();
        expect(array.count).toBe(2);
        expect(array.canAdd).toBe(false);
        expect(array.canRemove).toBe(true);
        expect(array.items).toHaveLength(2);
        expect(array.items[1]).toMatchObject({ field: 'body[1]', index: 1 });
        api().setValue('body[0]', 'changed');
        expect(array.items[0].value).toBe('changed');
        array.move(0, 1);
        expect(array.items.map((item) => item.field)).toEqual(['body[0]', 'body[1]']);
        expect(array.items[1].value).toBe('changed');
        expect(array.items[1].index).toBe(1);
    });

    it('数组的 add 默认按 schema 生成新行，点击事件不当作插入位置', async () => {
        const user = userEvent.setup();
        const { api } = renderSchema(
            { type: 'object', properties: { rows: { type: 'array', items: { type: 'object', required: ['tags'], properties: { tags: { type: 'array', items: { type: 'string' } } } } } } },
            { rows: [{ tags: ['a'] }] },
            { renderers: { array: (context) => <Button onClick={context.add}>add</Button> } }
        );
        await user.click(screen.getByRole('button', { name: 'add' }));
        expect(api().getValue('rows')).toEqual([{ tags: ['a'] }, { tags: [] }]);
    });

    it('focusField 先请调用方展开折叠的卡片，挂载后聚焦卡片里的控件', async () => {
        const jsonSchema = { type: 'object', properties: { contacts: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' } } } } } };
        const [open, setOpen] = createSignal<string[]>([]);
        let api!: FormApi;
        inEnglish(() => (
            <Form getFormApi={(formApi) => (api = formApi)} initValues={{ contacts: [{ name: 'Ann', email: 'a@x' }] }} onRevealField={(field) => setOpen((keys) => [...keys, field.replace(/\].*/, ']')])}>
                <SchemaField
                    jsonSchema={jsonSchema}
                    renderers={{
                        ...semiRenderers,
                        array: (context) => (
                            <div {...context.fieldProps}>
                                <For each={context.items}>
                                    {(item) => (
                                        <section aria-label={(item.value as { name: string }).name} x-field-id={item.field}>
                                            <Show when={open().includes(item.field)}>{context.render(() => item.field)}</Show>
                                        </section>
                                    )}
                                </For>
                            </div>
                        ),
                    }}
                    renderField={{ 'contacts[]': (context) => context.kind === 'object' && context.content }}
                />
            </Form>
        ));
        expect(screen.getByRole('region', { name: 'Ann' })).toBeEmptyDOMElement();
        // jsdom has no Element.scroll, which scroll-into-view-if-needed calls
        Element.prototype.scroll = () => undefined;
        try {
            await api.focusField('contacts[0].email');
        } finally {
            delete (Element.prototype as Partial<Element>).scroll;
        }
        expect(screen.getByRole('textbox', { name: 'email' })).toHaveFocus();
    });

    it('minItems 等于 maxItems 时行数固定，不显示添加与删除按钮', () => {
        renderSchema({ type: 'object', properties: { pair: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 } } }, { pair: [1, 2] });
        expect(screen.getAllByRole('spinbutton')).toHaveLength(2);
        expect(screen.queryByRole('button', { name: 'Add item' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Remove item 1' })).toBeNull();
        expect(screen.getByRole('button', { name: 'Move item 1 down' })).toBeEnabled();
    });

    it('读取 semiGlobal overrideDefaultProps 的 SchemaField 默认值', () => {
        semiGlobal.config.overrideDefaultProps = { SchemaField: { jsonSchema: { type: 'object', properties: { name: { type: 'string' } } }, renderers: semiRenderers } };
        inEnglish(() => (
            <Form>
                <SchemaField />
            </Form>
        ));
        expect(screen.getByRole('textbox', { name: 'name' })).toBeInTheDocument();
    });
});

describe('SchemaForm', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('按 schema 渲染字段，children 在字段之后，提交时 onSubmit 拿到 schema 的输出', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn<(values: { name: string; age: number }) => void>();
        inEnglish(() => (
            <SchemaForm renderers={semiRenderers} schema={z.object({ name: z.string().trim(), age: z.number().default(18) })} onSubmit={onSubmit}>
                <Button htmlType="submit">Submit</Button>
            </SchemaForm>
        ));
        const [name, submit] = [screen.getByRole('textbox', { name: /name/ }), screen.getByRole('button', { name: 'Submit' })];
        expect(name.compareDocumentPosition(submit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        await user.type(name, ' semi ');
        await user.click(submit);
        await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit.mock.calls[0][0]).toEqual({ name: 'semi', age: 18 });
    });

    it('读取 semiGlobal overrideDefaultProps 的 SchemaForm 默认值', () => {
        semiGlobal.config.overrideDefaultProps = { SchemaForm: { jsonSchema: { type: 'object', properties: { city: { type: 'string' } } }, renderers: semiRenderers } };
        inEnglish(() => <SchemaForm />);
        expect(screen.getByRole('textbox', { name: 'city' })).toBeInTheDocument();
    });
});
