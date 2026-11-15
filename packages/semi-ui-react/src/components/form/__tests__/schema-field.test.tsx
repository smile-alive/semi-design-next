import { useState } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import * as z from 'zod';
import { Button, Form, FormInput, SchemaField, SchemaForm, semiRenderers, type SchemaArrayContext, type SchemaFieldContext } from '@fibrae/semi-ui-react';
import { zh_CN } from '@fibrae/semi-ui-react/locale';
import { semiGlobal } from '@fibrae/semi-ui-react/utils';
import type { FormApi } from '../interface';
import type { JsonSchema } from '../schema-form/schema-field';

vi.mock('scroll-into-view-if-needed', () => ({ default: vi.fn<() => void>() }));

const text = zh_CN.Form;
const nth = (template: string, index: number) => template.replace('${index}', String(index));
const itemName = (title: string, index: number) => nth(text.arrayItem, index).replace('${title}', title);

function renderSchemaField(jsonSchema: JsonSchema, initValues?: Record<string, any>, extra?: Partial<React.ComponentProps<typeof SchemaField>>) {
    let api: FormApi;
    const view = render(
        <Form
            getFormApi={(formApi) => {
                api = formApi;
            }}
            initValues={initValues}
        >
            <SchemaField jsonSchema={jsonSchema} renderers={semiRenderers} {...extra} />
        </Form>
    );
    return { ...view, api: () => api };
}

const fieldOf = (container: HTMLElement, field: string) => container.querySelector(`.semi-form-field[x-field-id="${field}"]`);

describe('SchemaField', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('按 JSON Schema 的类型渲染内置控件，标题、说明、必填与默认值取自 schema', () => {
        const { container, api } = renderSchemaField({
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
        });
        expect(screen.getByRole('textbox', { name: /Name/ })).toHaveValue('semi');
        expect(screen.getByRole('textbox', { name: /Name/ })).toHaveAttribute('maxlength', '20');
        expect(screen.getByText('your name')).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'bio' }).tagName).toBe('TEXTAREA');
        expect(screen.getByRole('spinbutton', { name: 'age' })).toBeInTheDocument();
        expect(screen.getByRole('switch', { name: 'vip' })).toBeInTheDocument();
        expect(fieldOf(container, 'role').querySelector('.semi-select')).not.toBeNull();
        expect(fieldOf(container, 'tags').querySelector('.semi-select-multiple')).not.toBeNull();
        expect(screen.getByText('Address')).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'city' })).toBeInTheDocument();
        expect(container.querySelectorAll('.semi-form-field-label-required')).toHaveLength(1);
        expect(api().getValue('name')).toBe('semi');
    });

    it('field 只渲染该路径的节点，非根对象包在 Section 里', () => {
        renderSchemaField({ type: 'object', properties: { name: { type: 'string' }, address: { type: 'object', properties: { city: { type: 'string' } } } } }, undefined, { field: 'address' });
        expect(screen.queryByRole('textbox', { name: 'name' })).toBeNull();
        expect(screen.getByText('address')).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'city' })).toBeInTheDocument();
    });

    it('renderers 替换某一类节点的渲染，renderField 按 pattern 覆盖单个节点', () => {
        renderSchemaField(
            {
                type: 'object',
                properties: {
                    email: { type: 'string', format: 'email' },
                    note: { type: 'string' },
                    items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' } } } },
                },
            },
            { items: [{ label: 'x' }] },
            {
                renderers: { ...semiRenderers, field: (context) => (context.node.format === 'email' ? <span>{`email ${context.node.field}`}</span> : semiRenderers.field(context)) },
                renderField: { 'items[].label': ({ node }) => <span>{`custom ${node.field} ${node.kind}`}</span>, hidden: () => null },
            }
        );
        expect(screen.queryByRole('textbox', { name: 'secret' })).toBeNull();
        expect(screen.getByText('email email')).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'note' })).toBeInTheDocument();
        expect(screen.getByText('custom items[0].label input')).toBeInTheDocument();
    });

    it('不传 renderers 时只渲染对象的属性，叶子与数组不渲染并警告；缺少 JSON Schema 时警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const { container } = render(
            <Form>
                <SchemaField jsonSchema={{ type: 'object', properties: { name: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } } }} />
            </Form>
        );
        expect(container.querySelector('form')).toBeEmptyDOMElement();
        expect(warn).toHaveBeenCalledWith('Warning: [Semi Form] SchemaField renders nothing for "name": renderers has no field entry');
        expect(warn).toHaveBeenCalledWith('Warning: [Semi Form] SchemaField renders nothing for "tags": renderers has no array entry');
        renderSchemaField({ type: 'object', properties: { blob: {} } });
        expect(warn).toHaveBeenCalledWith('Warning: [Semi Form] SchemaField renders nothing for "blob": its schema maps to no control');
        render(
            <Form>
                <SchemaField />
            </Form>
        );
        expect(warn).toHaveBeenCalledWith('Warning: [Semi Form] SchemaField has no JSON Schema: pass jsonSchema, or give the Form a schema that exports one');
        warn.mockRestore();
    });

    it('jsonSchema 缺省时从 Form schema 导出', () => {
        render(
            <Form schema={z.object({ name: z.string(), count: z.number() })}>
                <SchemaField renderers={semiRenderers} />
            </Form>
        );
        expect(screen.getByRole('textbox', { name: /name/ })).toBeInTheDocument();
        expect(screen.getByRole('spinbutton', { name: /count/ })).toBeInTheDocument();
    });

    it('数组可以增删与移动行，按 minItems、maxItems 与首末行禁用按钮', async () => {
        const { api } = renderSchemaField({ type: 'object', properties: { tags: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 } } }, { tags: ['a', 'b'] });
        expect(screen.getByRole('textbox', { name: itemName('tags', 1) })).toHaveValue('a');
        expect(screen.getByRole('button', { name: nth(text.moveUpItem, 1) })).toBeDisabled();
        expect(screen.getByRole('button', { name: nth(text.moveDownItem, 2) })).toBeDisabled();
        await userEvent.click(screen.getByRole('button', { name: nth(text.moveDownItem, 1) }));
        expect(api().getValue('tags')).toEqual(['b', 'a']);
        expect(screen.getByRole('textbox', { name: itemName('tags', 1) })).toHaveValue('b');
        await userEvent.click(screen.getByRole('button', { name: text.addItem }));
        expect(screen.getAllByRole('textbox')).toHaveLength(3);
        expect(screen.getByRole('button', { name: text.addItem })).toBeDisabled();
        await userEvent.click(screen.getByRole('button', { name: nth(text.removeItem, 3) }));
        await userEvent.click(screen.getByRole('button', { name: nth(text.removeItem, 2) }));
        expect(api().getValue('tags')).toEqual(['b']);
        expect(screen.getByRole('button', { name: nth(text.removeItem, 1) })).toBeDisabled();
        expect(screen.getByRole('button', { name: text.addItem })).toBeEnabled();
    });

    it('对象数组的行渲染成带序号标题的 Section，新增行按 schema 预填', async () => {
        const { api } = renderSchemaField({
            type: 'object',
            properties: {
                contacts: { type: 'array', items: { type: 'object', required: ['phones'], properties: { email: { type: 'string' }, phones: { type: 'array', items: { type: 'string' }, minItems: 1 } } } },
            },
        });
        await userEvent.click(screen.getByRole('button', { name: text.addItem }));
        expect(screen.getByText(nth(text.item, 1), { selector: '.semi-form-section-text' })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'email' })).toBeInTheDocument();
        expect(api().getValue('contacts')).toEqual([{ phones: [undefined] }]);
    });

    it('semiRenderers：单值数组的行不显示标签与说明，以「数组标题 第 N 项」命名；对象项的字段照常显示标签', () => {
        const { container } = renderSchemaField(
            {
                type: 'object',
                properties: {
                    body: { type: 'array', title: '正文段落', description: '每一项是一个段落。', items: { type: 'string', title: '段落', description: '纯文本' } },
                    counts: { type: 'array', items: { type: 'number' } },
                    flags: { type: 'array', items: { type: 'boolean' } },
                    contacts: { type: 'array', items: { type: 'object', properties: { email: { type: 'string' }, phones: { type: 'array', items: { type: 'string' } } } } },
                },
            },
            { body: ['p1', 'p2'], counts: [1], flags: [true], contacts: [{ email: 'e', phones: ['x'] }] }
        );
        expect(screen.getByRole('textbox', { name: itemName('正文段落', 1) })).toHaveValue('p1');
        expect(screen.getByRole('textbox', { name: itemName('正文段落', 2) })).toHaveValue('p2');
        expect(fieldOf(container, 'body[0]')?.querySelector('label')).toBeNull();
        expect(screen.queryByText('纯文本')).toBeNull();
        expect(screen.getByRole('group', { name: '正文段落' })).toHaveAccessibleDescription('每一项是一个段落。');
        expect(screen.getByRole('spinbutton', { name: itemName('counts', 1) })).toHaveValue('1');
        expect(screen.getByRole('switch', { name: itemName('flags', 1) })).toBeChecked();
        expect(screen.getByRole('textbox', { name: 'email' })).toHaveValue('e');
        expect(screen.getByRole('textbox', { name: itemName('phones', 1) })).toHaveValue('x');
    });

    it('钩子交出节点信息：层级、说明、单值项的序号与所属数组，数组的行、条数、上下限与数组级错误', async () => {
        const seen: Record<string, SchemaFieldContext> = {};
        let array!: SchemaArrayContext;
        const { api } = renderSchemaField(
            {
                type: 'object',
                properties: {
                    profile: { type: 'object', description: '资料', properties: { name: { type: 'string' } } },
                    body: { type: 'array', title: '正文段落', description: '段落', minItems: 1, maxItems: 2, items: { type: 'string', title: '段', description: '一段' } },
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
                                {context.items.map((item) => (
                                    <div key={item.key}>{context.render(item.field)}</div>
                                ))}
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
        expect(seen.profile.node).toMatchObject({ depth: 1, description: '资料' });
        expect(seen['profile.name'].node).toMatchObject({ depth: 2, item: undefined });
        expect(seen['body[0]'].node).toMatchObject({ depth: 2, title: '段', description: '一段', item: { index: 0, arrayTitle: '正文段落', arrayKey: 'body' } });
        expect(array).toMatchObject({ count: 1, minItems: 1, maxItems: 2, canAdd: true, canRemove: false, fixed: false, fieldProps: { 'x-field-id': 'body' } });
        expect(array.node.description).toBe('段落');
        expect(array.items[0]).toMatchObject({ field: 'body[0]', index: 0, value: 'p1' });
        expect(screen.getByRole('textbox', { name: 'body[0]' })).toHaveValue('p1');
        act(() => api().setError('body', 'too few'));
        expect(array.error).toEqual(['too few']);
        act(() => array.add());
        expect(array.count).toBe(2);
        expect(array.canAdd).toBe(false);
    });

    it('数组的 add 默认按 schema 生成新行，点击事件不当作插入位置', async () => {
        const { api } = renderSchemaField(
            { type: 'object', properties: { rows: { type: 'array', items: { type: 'object', required: ['tags'], properties: { tags: { type: 'array', items: { type: 'string' } } } } } } },
            { rows: [{ tags: ['a'] }] },
            { renderers: { array: ({ add }) => <Button onClick={add}>add</Button> } }
        );
        await userEvent.click(screen.getByRole('button', { name: 'add' }));
        expect(api().getValue('rows')).toEqual([{ tags: ['a'] }, { tags: [] }]);
    });

    it('focusField 先请调用方展开折叠的卡片，挂载后聚焦卡片里的控件', async () => {
        const jsonSchema = { type: 'object', properties: { contacts: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' } } } } } };
        let api!: FormApi;
        function CardForm() {
            const [open, setOpen] = useState<string[]>([]);
            return (
                <Form getFormApi={(formApi) => (api = formApi)} initValues={{ contacts: [{ name: 'Ann', email: 'a@x' }] }} onRevealField={(field) => setOpen((keys) => [...keys, field.replace(/\].*/, ']')])}>
                    <SchemaField
                        jsonSchema={jsonSchema}
                        renderers={{
                            ...semiRenderers,
                            array: ({ items, render, fieldProps }) => (
                                <div {...fieldProps}>
                                    {items.map((item) => (
                                        <section key={item.key} aria-label={(item.value as { name: string }).name} x-field-id={item.field}>
                                            {open.includes(item.field) && render(item.field)}
                                        </section>
                                    ))}
                                </div>
                            ),
                        }}
                        renderField={{ 'contacts[]': (context) => context.kind === 'object' && context.content }}
                    />
                </Form>
            );
        }
        render(<CardForm />);
        expect(screen.getByRole('region', { name: 'Ann' })).toBeEmptyDOMElement();
        // the reveal renders when this act ends, which an async act would hold until focusField settles
        let focused!: Promise<void>;
        act(() => {
            focused = api.focusField('contacts[0].email');
        });
        await focused;
        expect(screen.getByRole('textbox', { name: 'email' })).toHaveFocus();
    });

    it('minItems 等于 maxItems 时行数固定，不显示添加与删除按钮', () => {
        renderSchemaField({ type: 'object', properties: { pair: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 } } }, { pair: [1, 2] });
        expect(screen.getAllByRole('spinbutton')).toHaveLength(2);
        expect(screen.queryByRole('button', { name: text.addItem })).toBeNull();
        expect(screen.queryByRole('button', { name: nth(text.removeItem, 1) })).toBeNull();
        expect(screen.getByRole('button', { name: nth(text.moveDownItem, 1) })).toBeEnabled();
    });

    it('读取 semiGlobal overrideDefaultProps 的 SchemaField 默认值', () => {
        semiGlobal.config.overrideDefaultProps = { SchemaField: { jsonSchema: { type: 'object', properties: { name: { type: 'string' } } }, renderers: semiRenderers } };
        render(
            <Form>
                <SchemaField />
            </Form>
        );
        expect(screen.getByRole('textbox', { name: 'name' })).toBeInTheDocument();
    });
});

describe('SchemaForm', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('按 schema 渲染字段，children 在字段之后，提交时 onSubmit 拿到 schema 的输出', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        render(
            <SchemaForm renderers={semiRenderers} schema={z.object({ name: z.string().trim(), age: z.number().default(18) })} onSubmit={onSubmit}>
                <Button htmlType="submit">submit</Button>
            </SchemaForm>
        );
        const [name, submit] = [screen.getByRole('textbox', { name: /name/ }), screen.getByRole('button', { name: 'submit' })];
        expect(name.compareDocumentPosition(submit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        await userEvent.type(name, ' semi ');
        await userEvent.click(submit);
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit.mock.calls[0][0]).toEqual({ name: 'semi', age: 18 });
    });

    it('读取 semiGlobal overrideDefaultProps 的 SchemaForm 默认值', () => {
        semiGlobal.config.overrideDefaultProps = { SchemaForm: { jsonSchema: { type: 'object', properties: { city: { type: 'string' } } }, renderers: semiRenderers } };
        render(<SchemaForm />);
        expect(screen.getByRole('textbox', { name: 'city' })).toBeInTheDocument();
    });
});
