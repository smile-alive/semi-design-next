import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import * as z from 'zod';
import { Form } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { FormApi } from '../interface';

const errorSelector = '.semi-form-field-error-message';
const nameSchema = z.object({ name: z.string({ error: 'required' }).min(2, 'too short') });

describe('Form schema', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('输入时显示 schema 的错误，改为有效值后消失，schema 不落到 DOM', async () => {
        const { container } = render(
            <Form schema={nameSchema}>
                <Form.Input field="name" />
            </Form>
        );
        expect(container.querySelector('form')).not.toHaveAttribute('schema');
        await userEvent.type(container.querySelector('input'), 'a');
        await waitFor(() => expect(container.querySelector(errorSelector)).toHaveTextContent('too short'));
        await userEvent.type(container.querySelector('input'), 'b');
        await waitFor(() => expect(container.querySelector(errorSelector)).toBeNull());
    });

    it('提交时 onSubmit 拿到 schema 的输出，字段值保持原样', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        let api: FormApi;
        const { container } = render(
            <Form
                getFormApi={(formApi) => {
                    api = formApi;
                }}
                schema={z.object({ name: z.string().trim() })}
                onSubmit={onSubmit}
            >
                <Form.Input field="name" />
            </Form>
        );
        await userEvent.type(container.querySelector('input'), ' abc ');
        api.submitForm();
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit.mock.calls[0][0]).toEqual({ name: 'abc' });
        expect(api.getValue('name')).toBe(' abc ');
    });

    it('改动一个字段时刷新另一个已 touched 字段的跨字段错误', async () => {
        const schema = z.object({ password: z.string({ error: 'required' }), confirm: z.string({ error: 'required' }) }).refine((values) => values.password === values.confirm, { path: ['confirm'], error: 'mismatch' });
        const { container } = render(
            <Form schema={schema}>
                <Form.Input field="password" />
                <Form.Input field="confirm" />
            </Form>
        );
        const [password, confirm] = container.querySelectorAll('input');
        await userEvent.type(password, 'a');
        await userEvent.type(confirm, 'a');
        await waitFor(() => expect(container.querySelector(errorSelector)).toBeNull());
        await userEvent.type(password, 'b');
        await waitFor(() => expect(container.querySelector(errorSelector)).toHaveTextContent('mismatch'));
    });

    it('从 semiGlobal overrideDefaultProps 读取 schema', async () => {
        semiGlobal.config.overrideDefaultProps = { Form: { schema: nameSchema } };
        let api: FormApi;
        const { container } = render(
            <Form
                getFormApi={(formApi) => {
                    api = formApi;
                }}
            >
                <Form.Input field="name" />
            </Form>
        );
        await expect(api.validate()).rejects.toEqual({ name: 'required' });
        await waitFor(() => expect(container.querySelector(errorSelector)).toHaveTextContent('required'));
    });
});
