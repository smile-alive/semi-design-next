/** @jsxImportSource vue */
import { shallowRef } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, within } from '@testing-library/vue';
import scrollIntoView from 'scroll-into-view-if-needed';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import * as z from 'zod';
import { zh_CN } from '@fibrae/semi-ui-vue/locale';
import { semiGlobal } from '@fibrae/semi-ui-vue/utils';
import { render, getElement } from '@test/utils/vue';
import { type FormApi, type JsonSchema, SchemaField, type SchemaArrayContext, type SchemaFieldContext, type SchemaFieldProps, SchemaForm, semiRenderers } from '..';
import Button from '../../button';
import { errorSelector, flush, FormInput, labelSelector, renderForm } from './fixtures/fields';

vi.mock('scroll-into-view-if-needed', () => ({ default: vi.fn<() => void>() }));

const text = zh_CN.Form;
const t = (template: string, index: number) => template.replace('${index}', String(index));
const itemName = (title: string, index: number) => t(text.arrayItem, index).replace('${title}', title);
const button = (template: string, index: number) => screen.getByRole('button', { name: t(template, index) });
const addButton = () => screen.getByRole('button', { name: text.addItem });
const labels = (container: Element) => Array.from(container.querySelectorAll(labelSelector), (label) => label.textContent);
const textboxValues = () => screen.getAllByRole('textbox').map((input) => (input as HTMLInputElement).value);
const fieldOf = (container: Element, field: string) => container.querySelector(`.semi-form-field[x-field-id="${field}"]`);

function renderSchemaField(jsonSchema: JsonSchema, initValues?: Record<string, unknown>, extra: SchemaFieldProps = {}) {
    return renderForm({ initValues }, () => <SchemaField jsonSchema={jsonSchema} renderers={semiRenderers} {...extra} />);
}

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
        expect(labels(container)).toEqual(['Name', 'bio', 'age', 'vip', 'role', 'tags', 'city']);
        expect(screen.getByRole('textbox', { name: /Name/ })).toHaveValue('semi');
        expect(screen.getByRole('textbox', { name: /Name/ })).toHaveAttribute('maxlength', '20');
        expect(screen.getByText('your name')).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'bio' }).tagName).toBe('TEXTAREA');
        expect(screen.getByText('0/500')).toBeInTheDocument();
        expect(screen.getByRole('spinbutton', { name: 'age' })).toBeInTheDocument();
        expect(screen.getByRole('switch', { name: 'vip' })).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: 'role' })).toBeInTheDocument();
        expect(fieldOf(container, 'tags')?.querySelector('.semi-select-multiple')).not.toBeNull();
        expect(container.querySelector('.semi-form-section-text')).toHaveTextContent('Address');
        expect(container.querySelectorAll('.semi-form-section')).toHaveLength(1);
        expect(container.querySelectorAll('.semi-form-field-label-required')).toHaveLength(1);
        expect(api().getValue('name')).toBe('semi');
    });

    it('field 只渲染该路径的节点，非根对象包在 Section 里', () => {
        const jsonSchema = { type: 'object', properties: { name: { type: 'string' }, b: { type: 'object', title: 'B', properties: { c: { type: 'string', default: 'x' } } } } };
        const { api, container } = renderSchemaField(jsonSchema, undefined, { field: 'b' });
        expect(labels(container)).toEqual(['c']);
        expect(container.querySelector('.semi-form-section-text')).toHaveTextContent('B');
        expect(api().getValues()).toEqual({ b: { c: 'x' } });
    });

    it('renderers 替换某一类节点的渲染，renderField 按 pattern 覆盖单个节点，返回 null 则隐藏', () => {
        const { container } = renderSchemaField(
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
                renderField: { 'items[].label': ({ node }) => <span>{`custom ${node.field} ${node.kind}`}</span>, secret: () => null },
            }
        );
        expect(screen.queryByRole('textbox', { name: 'secret' })).toBeNull();
        expect(fieldOf(container, 'secret')).toBeNull();
        expect(screen.getByText('email email')).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'note' })).toBeInTheDocument();
        expect(screen.getByText('custom items[0].label input')).toBeInTheDocument();
    });

    it('不传 renderers 时只渲染对象的属性，叶子与数组不渲染并警告；缺少 JSON Schema 时警告', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const jsonSchema = { type: 'object', properties: { name: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } } };
        const { container } = renderForm({}, () => <SchemaField jsonSchema={jsonSchema} />);
        await flush();
        expect(getElement('form').children).toHaveLength(0);
        expect(container.querySelector('.semi-form-field, .semi-form-section')).toBeNull();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('SchemaField renders nothing for "name": renderers has no field entry'));
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('SchemaField renders nothing for "tags": renderers has no array entry'));
        renderSchemaField({ type: 'object', properties: { blob: {} } });
        await flush();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('SchemaField renders nothing for "blob": its schema maps to no control'));
        renderForm({}, () => <SchemaField />);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('SchemaField has no JSON Schema'));
        warn.mockRestore();
    });

    it('jsonSchema 缺省时从 Form schema 导出', () => {
        const schema = z.object({ name: z.string(), count: z.number() });
        renderForm({ schema }, () => <SchemaField renderers={semiRenderers} />);
        expect(screen.getByRole('textbox', { name: /name/ })).toBeInTheDocument();
        expect(screen.getByRole('spinbutton', { name: /count/ })).toBeInTheDocument();
    });

    it('数组可以增删与移动行，按 minItems、maxItems 与首末行禁用按钮', async () => {
        const { api } = renderSchemaField({ type: 'object', properties: { tags: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 } } }, { tags: ['a', 'b'] });
        expect(screen.getByRole('textbox', { name: itemName('tags', 1) })).toHaveValue('a');
        expect(button(text.moveUpItem, 1)).toBeDisabled();
        expect(button(text.moveDownItem, 2)).toBeDisabled();
        await userEvent.click(button(text.moveDownItem, 1));
        await flush();
        expect(api().getValue('tags')).toEqual(['b', 'a']);
        expect(textboxValues()).toEqual(['b', 'a']);
        await userEvent.click(addButton());
        await flush();
        expect(screen.getAllByRole('textbox')).toHaveLength(3);
        expect(addButton()).toBeDisabled();
        await userEvent.click(button(text.removeItem, 3));
        await userEvent.click(button(text.removeItem, 2));
        await flush();
        expect(api().getValue('tags')).toEqual(['b']);
        expect(button(text.removeItem, 1)).toBeDisabled();
        expect(addButton()).toBeEnabled();
    });

    it('对象数组的行渲染成带序号标题的 Section，新增行按 schema 预填', async () => {
        const { api } = renderSchemaField({
            type: 'object',
            properties: {
                contacts: { type: 'array', items: { type: 'object', required: ['phones'], properties: { email: { type: 'string' }, phones: { type: 'array', items: { type: 'string' }, minItems: 1 } } } },
            },
        });
        await userEvent.click(addButton());
        await flush();
        expect(screen.getByText(t(text.item, 1), { selector: '.semi-form-section-text' })).toBeInTheDocument();
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
        expect(container.querySelectorAll('.semi-form-schema-array-row-single')).toHaveLength(5);
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
        api().setError('body', 'too few');
        await flush();
        expect(array.error).toEqual(['too few']);
        array.add();
        await flush();
        expect(array.count).toBe(2);
        expect(array.canAdd).toBe(false);
        expect(array.items.map((item) => item.field)).toEqual(['body[0]', 'body[1]']);
    });

    it('数组的 add 默认按 schema 生成新行，点击事件不当作插入位置', async () => {
        const { api } = renderSchemaField(
            { type: 'object', properties: { rows: { type: 'array', items: { type: 'object', required: ['tags'], properties: { tags: { type: 'array', items: { type: 'string' } } } } } } },
            { rows: [{ tags: ['a'] }] },
            { renderers: { array: ({ add }) => <Button onClick={add}>{() => 'add'}</Button> } }
        );
        await userEvent.click(screen.getByRole('button', { name: 'add' }));
        await flush();
        expect(api().getValue('rows')).toEqual([{ tags: ['a'] }, { tags: [] }]);
    });

    it('focusField 先请调用方展开折叠的卡片，挂载后聚焦卡片里的控件', async () => {
        const jsonSchema = { type: 'object', properties: { contacts: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' } } } } } };
        const open = shallowRef<string[]>([]);
        const { api } = renderForm({ initValues: { contacts: [{ name: 'Ann', email: 'a@x' }] }, onRevealField: (field: string) => (open.value = [...open.value, field.replace(/\].*/, ']')]) }, () => (
            <SchemaField
                jsonSchema={jsonSchema}
                renderers={{
                    ...semiRenderers,
                    array: ({ items, render, fieldProps }) => (
                        <div {...fieldProps}>
                            {items.map((item) => (
                                <section key={item.key} aria-label={(item.value as { name: string }).name} x-field-id={item.field}>
                                    {open.value.includes(item.field) && render(item.field)}
                                </section>
                            ))}
                        </div>
                    ),
                }}
                renderField={{ 'contacts[]': (context) => context.kind === 'object' && context.content }}
            />
        ));
        expect(screen.getByRole('region', { name: 'Ann' }).children).toHaveLength(0);
        await api().focusField('contacts[0].email');
        expect(screen.getByRole('textbox', { name: 'email' })).toHaveFocus();
    });

    it('scrollToField 对数组路径能到达预设的 Section', async () => {
        vi.mocked(scrollIntoView).mockClear();
        const { container, api } = renderSchemaField({ type: 'object', properties: { tags: { type: 'array', items: { type: 'string' } } } }, { tags: ['a'] });
        await api().scrollToField('tags');
        expect(scrollIntoView).toHaveBeenCalledWith(container.querySelector('fieldset[x-field-id="tags"]'), expect.anything());
    });

    it('minItems 等于 maxItems 时行数固定，不显示添加与删除按钮', () => {
        renderSchemaField({ type: 'object', properties: { pair: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 } } }, { pair: [1, 2] });
        expect(screen.getAllByRole('spinbutton')).toHaveLength(2);
        expect(screen.queryByRole('button', { name: text.addItem })).toBeNull();
        expect(screen.queryByRole('button', { name: t(text.removeItem, 1) })).toBeNull();
        expect(button(text.moveDownItem, 1)).toBeEnabled();
    });

    it('读取 semiGlobal overrideDefaultProps 的 SchemaField 默认值', () => {
        semiGlobal.config.overrideDefaultProps = { SchemaField: { jsonSchema: { type: 'object', properties: { name: { type: 'string' } } }, renderers: semiRenderers } };
        renderForm({}, () => <SchemaField />);
        expect(screen.getByRole('textbox', { name: 'name' })).toBeInTheDocument();
    });
});

describe('SchemaForm', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('渲染 schema 的字段与 children，提交得到 schema 的输出', async () => {
        const onSubmit = vi.fn<(values: unknown) => void>();
        const schema = z.object({ age: z.string().transform(Number) });
        let formApi: FormApi | undefined;
        render(() => (
            <SchemaForm initValues={{ age: '3' }} renderers={semiRenderers} schema={schema} onGetFormApi={(api: FormApi) => (formApi = api)} onSubmit={onSubmit}>
                {() => <Button htmlType="submit">{() => 'submit'}</Button>}
            </SchemaForm>
        ));
        const form = getElement<HTMLFormElement>('form');
        expect(within(form).getByRole('textbox', { name: 'age' })).toHaveValue('3');
        await userEvent.click(screen.getByRole('button', { name: 'submit' }));
        await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ age: 3 }, expect.anything()));
        expect(formApi?.getValue('age')).toBe('3');
    });

    it('jsonSchema 优先于 schema 的导出，校验仍走 schema', async () => {
        const schema = z.object({ name: z.string().min(2, 'too short') });
        const jsonSchema = { type: 'object', properties: { name: { type: 'string', title: '名字' } } };
        let formApi: FormApi | undefined;
        const { container } = render(() => <SchemaForm jsonSchema={jsonSchema} renderers={semiRenderers} schema={schema} onGetFormApi={(api: FormApi) => (formApi = api)} />);
        expect(labels(container)).toEqual(['名字']);
        await expect(formApi?.validate()).rejects.toEqual({ name: [expect.any(String)] });
        await fireEvent.update(screen.getByRole('textbox', { name: '名字' }), 'a');
        await vi.waitFor(() => expect(container.querySelector(errorSelector)).toHaveTextContent('too short'));
    });

    it('读取 semiGlobal overrideDefaultProps 的 SchemaForm 默认值', () => {
        semiGlobal.config.overrideDefaultProps = { SchemaForm: { jsonSchema: { type: 'object', properties: { city: { type: 'string' } } }, renderers: semiRenderers } };
        render(() => <SchemaForm />);
        expect(screen.getByRole('textbox', { name: 'city' })).toBeInTheDocument();
    });
});
