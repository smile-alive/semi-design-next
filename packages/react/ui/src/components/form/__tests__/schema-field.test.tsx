import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import * as z from 'zod';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { Button, Form, SchemaField, SchemaForm } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/utils/semi-global';
import type { FormApi } from '../interface';
import type { JsonSchema } from '../schema-field';

const text = zh_CN.Form;
const nth = (template: string, index: number) => template.replace('${index}', String(index));

function renderSchemaField(jsonSchema: JsonSchema, initValues?: Record<string, any>, extra?: Partial<React.ComponentProps<typeof SchemaField>>) {
    let api: FormApi;
    const view = render(
        <Form
            getFormApi={(formApi) => {
                api = formApi;
            }}
            initValues={initValues}
        >
            <SchemaField jsonSchema={jsonSchema} {...extra} />
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

    it('widgets 按 format 优先、其次按 kind 替换控件，renderField 按 pattern 覆盖节点', () => {
        function EmailWidget({ field }: { field: string }) {
            return <span>{`email widget ${field}`}</span>;
        }
        function InputWidget({ field, label }: { field: string; label: { text: string } }) {
            return <span>{`input widget ${field} ${label.text}`}</span>;
        }
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
                widgets: { email: EmailWidget, input: InputWidget },
                renderField: { 'items[].label': ({ field, node }) => <span>{`custom ${field} ${node.kind}`}</span> },
            }
        );
        expect(screen.getByText('email widget email')).toBeInTheDocument();
        expect(screen.getByText('input widget note note')).toBeInTheDocument();
        expect(screen.getByText('custom items[0].label input')).toBeInTheDocument();
    });

    it('没有对应控件的节点不渲染并警告，缺少 JSON Schema 时警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        renderSchemaField({ type: 'object', properties: { name: { type: 'string' }, blob: {} } });
        expect(screen.getByRole('textbox', { name: 'name' })).toBeInTheDocument();
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
                <SchemaField />
            </Form>
        );
        expect(screen.getByRole('textbox', { name: /name/ })).toBeInTheDocument();
        expect(screen.getByRole('spinbutton', { name: /count/ })).toBeInTheDocument();
    });

    it('数组可以增删与移动行，按 minItems、maxItems 与首末行禁用按钮', async () => {
        const { api } = renderSchemaField({ type: 'object', properties: { tags: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 } } }, { tags: ['a', 'b'] });
        expect(screen.getByRole('textbox', { name: nth(text.item, 1) })).toHaveValue('a');
        expect(screen.getByRole('button', { name: nth(text.moveUpItem, 1) })).toBeDisabled();
        expect(screen.getByRole('button', { name: nth(text.moveDownItem, 2) })).toBeDisabled();
        await userEvent.click(screen.getByRole('button', { name: nth(text.moveDownItem, 1) }));
        expect(api().getValue('tags')).toEqual(['b', 'a']);
        expect(screen.getByRole('textbox', { name: nth(text.item, 1) })).toHaveValue('b');
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

    it('minItems 等于 maxItems 时行数固定，不显示添加与删除按钮', () => {
        renderSchemaField({ type: 'object', properties: { pair: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 } } }, { pair: [1, 2] });
        expect(screen.getAllByRole('spinbutton')).toHaveLength(2);
        expect(screen.queryByRole('button', { name: text.addItem })).toBeNull();
        expect(screen.queryByRole('button', { name: nth(text.removeItem, 1) })).toBeNull();
        expect(screen.getByRole('button', { name: nth(text.moveDownItem, 1) })).toBeEnabled();
    });

    it('读取 semiGlobal overrideDefaultProps 的 SchemaField 默认值', () => {
        semiGlobal.config.overrideDefaultProps = { SchemaField: { jsonSchema: { type: 'object', properties: { name: { type: 'string' } } } } };
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
            <SchemaForm schema={z.object({ name: z.string().trim(), age: z.number().default(18) })} onSubmit={onSubmit}>
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
        semiGlobal.config.overrideDefaultProps = { SchemaForm: { jsonSchema: { type: 'object', properties: { city: { type: 'string' } } } } };
        render(<SchemaForm />);
        expect(screen.getByRole('textbox', { name: 'city' })).toBeInTheDocument();
    });
});
