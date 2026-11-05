import { render } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import * as z from 'zod';
import { type FormApi, Form, FormInput } from '..';
import semiGlobal from '../../_utils/semi-global';

const errorSelector = '.semi-form-field-error-message';
const nameSchema = z.object({ name: z.string({ error: 'required' }).min(2, 'too short') });

describe('Form schema', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('输入时显示 schema 的错误，改为有效值后消失，schema 不落到 DOM', async () => {
        const { container } = render(() => (
            <Form schema={nameSchema}>
                <FormInput field="name" />
            </Form>
        ));
        const input = container.querySelector('input') as HTMLInputElement;
        expect(container.querySelector('form')).not.toHaveAttribute('schema');
        await userEvent.type(input, 'a');
        await vi.waitFor(() => expect(container.querySelector(errorSelector)).toHaveTextContent('too short'));
        await userEvent.type(input, 'b');
        await vi.waitFor(() => expect(container.querySelector(errorSelector)).toBeNull());
    });

    it('提交时 onSubmit 拿到 schema 的输出，字段值保持原样', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        let api: FormApi | undefined;
        const { container } = render(() => (
            <Form schema={z.object({ name: z.string().trim() })} getFormApi={(formApi) => (api = formApi)} onSubmit={onSubmit}>
                <FormInput field="name" />
            </Form>
        ));
        await userEvent.type(container.querySelector('input') as HTMLInputElement, ' abc ');
        api?.submitForm();
        await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit.mock.calls[0][0]).toEqual({ name: 'abc' });
        expect(api?.getValue('name')).toBe(' abc ');
    });

    it('改动一个字段时刷新另一个已 touched 字段的跨字段错误', async () => {
        const schema = z.object({ password: z.string({ error: 'required' }), confirm: z.string({ error: 'required' }) }).refine((values) => values.password === values.confirm, { path: ['confirm'], error: 'mismatch' });
        const { container } = render(() => (
            <Form schema={schema}>
                <FormInput field="password" />
                <FormInput field="confirm" />
            </Form>
        ));
        const [password, confirm] = container.querySelectorAll('input');
        await userEvent.type(password, 'a');
        await userEvent.type(confirm, 'a');
        await vi.waitFor(() => expect(container.querySelector(errorSelector)).toBeNull());
        await userEvent.type(password, 'b');
        await vi.waitFor(() => expect(container.querySelector(errorSelector)).toHaveTextContent('mismatch'));
    });

    it('从 semiGlobal overrideDefaultProps 读取 schema', async () => {
        semiGlobal.config.overrideDefaultProps = { Form: { schema: nameSchema } } as typeof semiGlobal.config.overrideDefaultProps;
        let api: FormApi | undefined;
        const { container } = render(() => (
            <Form getFormApi={(formApi) => (api = formApi)}>
                <FormInput field="name" />
            </Form>
        ));
        await expect(api?.validate()).rejects.toEqual({ name: 'required' });
        await vi.waitFor(() => expect(container.querySelector(errorSelector)).toHaveTextContent('required'));
    });
});
