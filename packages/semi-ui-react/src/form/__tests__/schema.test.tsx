import { act, fireEvent, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import * as z from 'zod';
import type { StandardSchema } from '@fibrae/semi-foundation/form/interface';
import { Form, FormInput } from '@fibrae/semi-ui-react';
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
                <FormInput field="name" />
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
                <FormInput field="name" />
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
                <FormInput field="password" />
                <FormInput field="confirm" />
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
                <FormInput field="name" />
            </Form>
        );
        await expect(api.validate()).rejects.toEqual({ name: ['required'] });
        await waitFor(() => expect(container.querySelector(errorSelector)).toHaveTextContent('required'));
    });

    it('schemaDebounce 期间连续输入不校验，停顿到时长后只校验一次', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        try {
            const validate = vi.fn<StandardSchema['~standard']['validate']>((value) => nameSchema['~standard'].validate(value));
            const schema: StandardSchema<{ name: string }> = { '~standard': { version: 1, vendor: 'test', validate } };
            const { container } = render(
                <Form schema={schema} schemaDebounce={300}>
                    <FormInput field="name" />
                </Form>
            );
            const input = container.querySelector('input');
            fireEvent.change(input, { target: { value: 'a' } });
            await act(() => vi.advanceTimersByTimeAsync(200));
            fireEvent.change(input, { target: { value: 'b' } });
            await act(() => vi.advanceTimersByTimeAsync(299));
            expect(validate).not.toHaveBeenCalled();
            expect(container.querySelector(errorSelector)).toBeNull();
            await act(() => vi.advanceTimersByTimeAsync(1));
            expect(validate).toHaveBeenCalledTimes(1);
            expect(container.querySelector(errorSelector)).toHaveTextContent('too short');
        } finally {
            vi.useRealTimers();
        }
    });

    it('有 schema 时必填星号只看 label.required，字段 rules 的 required 被忽略', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const { container } = render(
            <Form schema={nameSchema}>
                <FormInput field="name" label="Name" rules={[{ required: true }]} />
                <FormInput field="nick" label={{ text: 'Nick', required: true }} />
            </Form>
        );
        const asterisks = container.querySelectorAll('.semi-form-field-label-required');
        expect(asterisks).toHaveLength(1);
        expect(asterisks[0]).toHaveTextContent('Nick');
        warn.mockRestore();
    });
});

describe('字段级 validator', () => {
    it('字段 validator 可以是 Standard Schema，错误按 schema 的 issue 显示', async () => {
        let api: FormApi;
        const { container } = render(
            <Form
                getFormApi={(formApi) => {
                    api = formApi;
                }}
            >
                <FormInput field="name" validator={z.string({ error: 'required' }).min(2, 'too short')} />
            </Form>
        );
        await userEvent.type(container.querySelector('input'), 'a');
        await waitFor(() => expect(container.querySelector(errorSelector)).toHaveTextContent('too short'));
        expect(api.getError('name')).toEqual(['too short']);
        await userEvent.type(container.querySelector('input'), 'b');
        await waitFor(() => expect(container.querySelector(errorSelector)).toBeNull());
    });

    it('同时传入 rules 与 validator 时警告一次并使用 validator', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const { container } = render(
            <Form>
                {/* @ts-expect-error rules and validator are exclusive */}
                <FormInput field="name" rules={[{ required: true, message: 'from rules' }]} validator={(value) => (value === 'x' ? 'from validator' : undefined)} />
            </Form>
        );
        expect(warn).toHaveBeenCalledWith('Warning: [Semi Form] the rules and validator of field "name" are exclusive; validator is used');
        await userEvent.type(container.querySelector('input'), 'x');
        await waitFor(() => expect(container.querySelector(errorSelector)).toHaveTextContent('from validator'));
        await userEvent.clear(container.querySelector('input'));
        await waitFor(() => expect(container.querySelector(errorSelector)).toBeNull());
        expect(warn.mock.calls.filter(([message]) => String(message).includes('exclusive'))).toHaveLength(1);
        warn.mockRestore();
    });
});
