/** @jsxImportSource vue */
import { defineComponent } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, within } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import * as z from 'zod';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { render } from '@test/utils/vue';
import { type FormApi, SchemaField, type SchemaFieldRenderer, SchemaForm, withField } from '..';
import Button from '../../button';
import { errorSelector, flush, FormInput, labelSelector, renderForm } from './fixtures/fields';

const t = (template: string, index: number) => template.replace('${index}', String(index));
const button = (template: string, index: number) => screen.getByRole('button', { name: t(template, index) });
const addButton = () => screen.getByRole('button', { name: zh_CN.Form.addItem });
const labels = (container: Element) => Array.from(container.querySelectorAll(labelSelector), (label) => label.textContent);
const textboxValues = () => screen.getAllByRole('textbox').map((input) => (input as HTMLInputElement).value);

const UrlInput = withField(
    defineComponent({
        props: { modelValue: String, id: String },
        emits: ['change'],
        setup:
            (props, { emit }) =>
            () => <input data-testid="url" id={props.id} value={props.modelValue ?? ''} onInput={(e) => emit('change', (e.target as HTMLInputElement).value)} />,
    })
);

describe('SchemaField', () => {
    it('按 schema 的属性顺序渲染各类控件，标签取 title 或属性名，必填看 required', () => {
        const schema = z.object({
            name: z.string().max(20).describe('your name'),
            bio: z.string().max(500).optional(),
            age: z.number().int().min(0),
            agree: z.boolean().optional(),
            role: z.enum(['admin', 'user']),
            address: z.object({ city: z.string().meta({ title: '城市' }) }),
        });
        const { container } = renderForm({ schema }, () => <SchemaField />);
        expect(labels(container)).toEqual(['name', 'bio', 'age', 'agree', 'role', '城市']);
        expect(screen.getByRole('textbox', { name: 'name' })).toHaveAttribute('maxlength', '20');
        expect(screen.getByRole('textbox', { name: 'name' })).toHaveAttribute('aria-required', 'true');
        expect(screen.getByRole('textbox', { name: 'bio' }).tagName).toBe('TEXTAREA');
        expect(screen.getByRole('textbox', { name: 'bio' })).toHaveAttribute('aria-required', 'false');
        expect(screen.getByRole('spinbutton', { name: 'age' })).toBeInTheDocument();
        expect(screen.getByRole('switch', { name: 'agree' })).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: 'role' })).toBeInTheDocument();
        expect(screen.getByText('your name')).toBeInTheDocument();
        expect(container.querySelector('.semi-form-section-text')).toHaveTextContent('address');
        expect(container.querySelectorAll('.semi-form-section')).toHaveLength(1);
    });

    it('field 只渲染该子树，default 作为 initValue', () => {
        const jsonSchema = { type: 'object', properties: { a: { type: 'string' }, b: { type: 'object', title: 'B', properties: { c: { type: 'string', default: 'x' } } } } };
        const { api, container } = renderForm({}, () => <SchemaField field="b" jsonSchema={jsonSchema} />);
        expect(labels(container)).toEqual(['c']);
        expect(container.querySelector('.semi-form-section-text')).toHaveTextContent('B');
        expect(api().getValues()).toEqual({ b: { c: 'x' } });
    });

    it('widgets 先按 format 再按 kind 替换控件，renderField 按路径覆盖节点', async () => {
        const schema = z.object({ site: z.url(), agree: z.boolean(), contacts: z.array(z.object({ email: z.string(), phone: z.string() })) });
        const renderEmail = vi.fn<SchemaFieldRenderer>(({ field }) => <FormInput field={field} label="custom email" />);
        const SwitchLike = withField(defineComponent({ props: { modelValue: Boolean }, setup: () => () => <span data-testid="switch-like" /> }));
        const { api } = renderForm({ schema, initValues: { contacts: [{ email: 'a@b.c' }] } }, () => <SchemaField renderField={{ 'contacts[].email': renderEmail }} widgets={{ uri: UrlInput, switch: SwitchLike }} />);
        expect(screen.getByTestId('switch-like')).toBeInTheDocument();
        expect(screen.queryByRole('switch')).toBeNull();
        expect(screen.getByRole('textbox', { name: 'custom email' })).toHaveValue('a@b.c');
        expect(renderEmail.mock.calls[0][0]).toMatchObject({ field: 'contacts[0].email', node: { pattern: 'contacts[].email', kind: 'input' } });
        await fireEvent.update(screen.getByTestId('url'), 'https://semi.design');
        expect(api().getValue('site')).toBe('https://semi.design');
    });

    it('不支持的节点不渲染，按路径警告一次；没有 JSON Schema 时警告并渲染空', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const jsonSchema = { type: 'object', properties: { ok: { type: 'string' }, odd: {} } };
        const view = renderForm({}, () => <SchemaField jsonSchema={jsonSchema} />);
        expect(labels(view.container)).toEqual(['ok']);
        await view.rerender({ disabled: true });
        expect(warn.mock.calls.filter(([message]) => String(message).includes('"odd"'))).toHaveLength(1);
        view.unmount();
        warn.mockClear();
        const empty = renderForm({}, () => <SchemaField />);
        expect(empty.container.querySelector('.semi-form-field')).toBeNull();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('no JSON Schema'));
    });

    it('数组行可增删移动，minItems、maxItems 到达时禁用删除与添加，首末行禁用上移与下移', async () => {
        const schema = z.object({ tags: z.array(z.string()).min(1).max(3) });
        const { api } = renderForm({ schema, initValues: { tags: ['a', 'b'] } }, () => <SchemaField />);
        expect(screen.getByRole('textbox', { name: t(zh_CN.Form.item, 1) })).toHaveValue('a');
        expect(button(zh_CN.Form.moveUpItem, 1)).toBeDisabled();
        expect(button(zh_CN.Form.moveDownItem, 2)).toBeDisabled();
        await userEvent.click(button(zh_CN.Form.moveDownItem, 1));
        await flush();
        expect(textboxValues()).toEqual(['b', 'a']);
        await userEvent.click(addButton());
        await flush();
        expect(api().getValue('tags')).toEqual(['b', 'a', undefined]);
        expect(addButton()).toBeDisabled();
        await userEvent.click(button(zh_CN.Form.removeItem, 3));
        await userEvent.click(button(zh_CN.Form.removeItem, 2));
        await flush();
        expect(api().getValue('tags')).toEqual(['b']);
        expect(button(zh_CN.Form.removeItem, 1)).toBeDisabled();
    });

    it('对象数组的新行按 schema 预填必填的嵌套对象', async () => {
        const schema = z.object({ users: z.array(z.object({ name: z.string(), address: z.object({ city: z.string() }) })) });
        const { api, container } = renderForm({ schema }, () => <SchemaField />);
        await userEvent.click(addButton());
        await flush();
        expect(api().getValue('users')).toEqual([{ address: {} }]);
        expect([...container.querySelectorAll('.semi-form-section-text')].map((node) => node.textContent?.trim())).toEqual(['users', t(zh_CN.Form.item, 1), 'address']);
    });

    it('minItems 等于 maxItems 时不渲染添加与删除', () => {
        const schema = z.object({ pair: z.array(z.string()).length(2) });
        renderForm({ schema, initValues: { pair: ['a', 'b'] } }, () => <SchemaField />);
        expect(screen.queryByRole('button', { name: zh_CN.Form.addItem })).toBeNull();
        expect(screen.queryByRole('button', { name: t(zh_CN.Form.removeItem, 1) })).toBeNull();
        expect(button(zh_CN.Form.moveDownItem, 1)).toBeEnabled();
    });

    it('字符串枚举数组渲染为多选', () => {
        const schema = z.object({ colors: z.array(z.enum(['red', 'blue'])) });
        renderForm({ schema, initValues: { colors: ['red'] } }, () => <SchemaField />);
        expect(screen.getByRole('combobox', { name: 'colors' })).toBeInTheDocument();
        expect(document.querySelector('.semi-select-multiple')).not.toBeNull();
    });
});

describe('SchemaForm', () => {
    it('渲染 schema 的字段与 children，提交得到 schema 的输出', async () => {
        const onSubmit = vi.fn<(values: unknown) => void>();
        const schema = z.object({ age: z.string().transform(Number) });
        let formApi: FormApi | undefined;
        render(() => (
            <SchemaForm initValues={{ age: '3' }} schema={schema} onGetFormApi={(api: FormApi) => (formApi = api)} onSubmit={onSubmit}>
                {() => <Button htmlType="submit">{() => 'submit'}</Button>}
            </SchemaForm>
        ));
        const form = document.querySelector('form') as HTMLFormElement;
        expect(within(form).getByRole('textbox', { name: 'age' })).toHaveValue('3');
        await userEvent.click(screen.getByRole('button', { name: 'submit' }));
        await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ age: 3 }, expect.anything()));
        expect(formApi?.getValue('age')).toBe('3');
    });

    it('jsonSchema 优先于 schema 的导出，校验仍走 schema', async () => {
        const schema = z.object({ name: z.string().min(2, 'too short') });
        const jsonSchema = { type: 'object', properties: { name: { type: 'string', title: '名字' } } };
        let formApi: FormApi | undefined;
        const { container } = render(() => <SchemaForm jsonSchema={jsonSchema} schema={schema} onGetFormApi={(api: FormApi) => (formApi = api)} />);
        expect(labels(container)).toEqual(['名字']);
        await expect(formApi?.validate()).rejects.toEqual({ name: [expect.any(String)] });
        await fireEvent.update(screen.getByRole('textbox', { name: '名字' }), 'a');
        await vi.waitFor(() => expect(container.querySelector(errorSelector)).toHaveTextContent('too short'));
    });
});
