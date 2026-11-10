import { render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import * as z from 'zod';
import { en_US } from '@fibrae/semi-ui-solid/locale';
import { type FormApi, Form, FormInput, SchemaField, SchemaForm, withField } from '..';
import Button from '../../button';
import LocaleProvider from '../../locale/locale-provider';

const profile = {
    type: 'object',
    required: ['name'],
    properties: {
        name: { type: 'string', title: 'Name' },
        bio: { type: 'string', title: 'Bio', maxLength: 500 },
        age: { type: 'integer', title: 'Age', minimum: 0 },
        active: { type: 'boolean', title: 'Active' },
        role: { type: 'string', title: 'Role', enum: ['admin', 'user'] },
        address: { type: 'object', title: 'Address', properties: { city: { type: 'string', title: 'City' } } },
    },
};

const contacts = (limits: { minItems?: number; maxItems?: number }) => ({
    type: 'object',
    properties: { contacts: { type: 'array', title: 'Contacts', ...limits, items: { type: 'object', properties: { email: { type: 'string', title: 'Email' } } } } },
});

const emails = () => screen.queryAllByRole('textbox', { name: 'Email' }).map((input) => (input as HTMLInputElement).value);

function renderSchema(jsonSchema: Record<string, any>, initValues?: Record<string, any>, field?: string) {
    let api: FormApi | undefined;
    const result = render(() => (
        <LocaleProvider locale={en_US}>
            <Form getFormApi={(formApi) => (api = formApi)} initValues={initValues}>
                <SchemaField field={field} jsonSchema={jsonSchema} />
            </Form>
        </LocaleProvider>
    ));
    return { ...result, api: () => api as FormApi };
}

describe('SchemaField', () => {
    it('按节点类型渲染输入框、长文本、数字、开关、单选与嵌套对象，必填项带星号', () => {
        const { container } = renderSchema(profile);
        expect(screen.getByRole('textbox', { name: 'Name' }).tagName).toBe('INPUT');
        expect(screen.getByRole('textbox', { name: 'Bio' }).tagName).toBe('TEXTAREA');
        expect(screen.getByRole('spinbutton', { name: 'Age' })).toBeInTheDocument();
        expect(screen.getByRole('switch', { name: 'Active' })).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: 'Role' })).toBeInTheDocument();
        expect(screen.getByText('Address')).toBeInTheDocument();
        expect(container.querySelector('[x-field-id="address.city"]')).toContainElement(screen.getByRole('textbox', { name: 'City' }));
        const requiredLabels = [...container.querySelectorAll('.semi-form-field-label-required')].map((label) => label.textContent);
        expect(requiredLabels).toEqual(['Name']);
    });

    it('widgets 按 format 再按类型替换控件，renderField 按路径接管节点', () => {
        const Url = withField((props: { value?: string; id?: string }) => <output id={props.id}>url:{props.value}</output>);
        render(() => (
            <Form>
                <SchemaField
                    jsonSchema={{ type: 'object', properties: { site: { type: 'string', format: 'uri', default: 'https://semi.design' }, flag: { type: 'boolean', title: 'Flag' }, note: { type: 'string', title: 'Note' } } }}
                    renderField={{ note: (context) => <p>custom {context.field}</p> }}
                    widgets={{ uri: Url, switch: FormInput }}
                />
            </Form>
        ));
        expect(screen.getByText('url:https://semi.design')).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'Flag' })).toBeInTheDocument();
        expect(screen.queryByRole('switch')).toBeNull();
        expect(screen.getByText('custom note')).toBeInTheDocument();
        expect(screen.queryByRole('textbox', { name: 'Note' })).toBeNull();
    });

    it('无法渲染的节点打印警告且不渲染', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        renderSchema({ type: 'object', properties: { pair: { type: 'array', prefixItems: [{ type: 'string' }] } } });
        expect(warn.mock.calls.some(([message]) => String(message).includes('SchemaField cannot render the schema of "pair"'))).toBe(true);
        warn.mockRestore();
    });

    it('field 只渲染指定子树', () => {
        renderSchema(profile, undefined, 'address');
        expect(screen.getByRole('textbox', { name: 'City' })).toBeInTheDocument();
        expect(screen.queryByRole('textbox', { name: 'Name' })).toBeNull();
    });

    it('数组按 minItems 与 maxItems 禁用删除与新增，行可上下移动，可访问名称来自语言包', async () => {
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

    it('minItems 等于 maxItems 时不显示新增与删除按钮', () => {
        renderSchema(contacts({ minItems: 1, maxItems: 1 }), { contacts: [{ email: 'a' }] });
        expect(screen.queryByRole('button', { name: 'Add item' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Remove item 1' })).toBeNull();
        expect(emails()).toEqual(['a']);
    });
});

describe('SchemaForm', () => {
    it('从 schema 渲染字段，提交时 onSubmit 拿到 schema 的输出', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn<(values: { name: string }) => void>();
        render(() => (
            <SchemaForm schema={z.object({ name: z.string().trim().meta({ title: 'Name' }) })} onSubmit={onSubmit}>
                <Button htmlType="submit">Submit</Button>
            </SchemaForm>
        ));
        await user.type(screen.getByRole('textbox', { name: 'Name' }), ' abc ');
        await user.click(screen.getByRole('button', { name: 'Submit' }));
        await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit.mock.calls[0][0]).toEqual({ name: 'abc' });
    });
});
