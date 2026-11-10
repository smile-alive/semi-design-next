import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import * as z from 'zod';
import { semiGlobal } from '@fibrae/semi-ui-svelte/utils';
import { errorSelector, getInput, input, labelSelector, renderForm, settle, typeInto } from './helpers';

const nameSchema = z.object({ name: z.string({ error: 'required' }).min(2, 'too short') });

describe('Svelte Form schema', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('输入时显示 schema 的错误，改为有效值后消失，schema 不落到 DOM', async () => {
        const { container } = renderForm({ schema: nameSchema }, [input('name')]);
        expect(container.querySelector('form')).not.toHaveAttribute('schema');
        await typeInto(getInput(), 'a');
        await vi.waitFor(() => expect(container.querySelector(errorSelector)).toHaveTextContent('too short'));
        await typeInto(getInput(), 'ab');
        await vi.waitFor(() => expect(container.querySelector(errorSelector)).toBeNull());
    });

    it('提交时 onSubmit 拿到 schema 的输出，字段值保持原样', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const { api } = renderForm({ schema: z.object({ name: z.string().trim() }), onSubmit }, [input('name')]);
        await typeInto(getInput(), ' abc ');
        api().submitForm();
        await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit.mock.calls[0][0]).toEqual({ name: 'abc' });
        expect(api().getValue('name')).toBe(' abc ');
    });

    it('改动一个字段时刷新另一个已 touched 字段的跨字段错误', async () => {
        const schema = z.object({ password: z.string({ error: 'required' }), confirm: z.string({ error: 'required' }) }).refine((values) => values.password === values.confirm, { path: ['confirm'], error: 'mismatch' });
        const { container } = renderForm({ schema }, [input('password'), input('confirm')]);
        const [password, confirm] = container.querySelectorAll<HTMLInputElement>('input.semi-input');
        await typeInto(password, 'a');
        await typeInto(confirm, 'a');
        await settle();
        expect(container.querySelector(errorSelector)).toBeNull();
        await typeInto(password, 'ab');
        await vi.waitFor(() => expect(container.querySelector(errorSelector)).toHaveTextContent('mismatch'));
    });

    it('schemaDebounce 推迟输入触发的 schema 校验', async () => {
        vi.useFakeTimers();
        try {
            const { container } = renderForm({ schema: nameSchema, schemaDebounce: 200 }, [input('name')]);
            await typeInto(getInput(), 'a');
            await vi.advanceTimersByTimeAsync(100);
            flushSync();
            expect(container.querySelector(errorSelector)).toBeNull();
            await vi.advanceTimersByTimeAsync(200);
            flushSync();
            expect(container.querySelector(errorSelector)).toHaveTextContent('too short');
        } finally {
            vi.useRealTimers();
        }
    });

    it('有 schema 时必填星号只跟随 label.required，不读 rules', () => {
        const { container } = renderForm({ schema: nameSchema }, [input('name', { label: 'Name', rules: [{ required: true }] }), input('other', { label: { text: 'Other', required: true } })]);
        const labels = container.querySelectorAll(labelSelector);
        expect(labels[0]).not.toHaveClass('semi-form-field-label-required');
        expect(labels[1]).toHaveClass('semi-form-field-label-required');
    });

    it('字段 validator 接受 Standard Schema，错误取其 issue 文案', async () => {
        const { api, container } = renderForm({}, [input('name', { validator: z.string().min(3, 'min 3') })]);
        await typeInto(getInput(), 'ab');
        await vi.waitFor(() => expect(container.querySelector(errorSelector)).toHaveTextContent('min 3'));
        await typeInto(getInput(), 'abc');
        await vi.waitFor(() => expect(container.querySelector(errorSelector)).toBeNull());
        await expect(api().validate()).resolves.toEqual({ name: 'abc' });
    });

    it('从 semiGlobal overrideDefaultProps 读取 schema', async () => {
        semiGlobal.config.overrideDefaultProps = { Form: { schema: nameSchema } };
        const { api, container } = renderForm({}, [input('name')]);
        await expect(api().validate()).rejects.toEqual({ name: ['required'] });
        await vi.waitFor(() => expect(container.querySelector(errorSelector)).toHaveTextContent('required'));
    });
});
