/** @jsxImportSource vue */
import { fireEvent } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import * as z from 'zod';
import { semiGlobal } from '@fibrae/semi-ui-vue/utils';
import { errorSelector, flush, FormInput, getInput, getInputs, renderForm } from './fixtures/fields';

const nameSchema = z.object({ name: z.string({ error: 'required' }).min(2, 'too short') });
const nameInput = () => <FormInput field="name" />;

describe('Form schema', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('输入时显示 schema 的错误，改为有效值后消失，schema 不落到 DOM', async () => {
        const { container } = renderForm({ schema: nameSchema }, nameInput);
        expect(container.querySelector('form')).not.toHaveAttribute('schema');
        await fireEvent.update(getInput(), 'a');
        await vi.waitFor(() => expect(container.querySelector(errorSelector)).toHaveTextContent('too short'));
        await fireEvent.update(getInput(), 'ab');
        await vi.waitFor(() => expect(container.querySelector(errorSelector)).toBeNull());
    });

    it('提交时 onSubmit 拿到 schema 的输出，字段值保持原样', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const { api } = renderForm({ schema: z.object({ name: z.string().trim() }), onSubmit }, nameInput);
        await fireEvent.update(getInput(), ' abc ');
        api().submitForm();
        await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit.mock.calls[0][0]).toEqual({ name: 'abc' });
        expect(api().getValue('name')).toBe(' abc ');
    });

    it('改动一个字段时刷新另一个已 touched 字段的跨字段错误', async () => {
        const schema = z.object({ password: z.string({ error: 'required' }), confirm: z.string({ error: 'required' }) }).refine((values) => values.password === values.confirm, { path: ['confirm'], error: 'mismatch' });
        const { container } = renderForm({ schema }, () => [<FormInput field="password" />, <FormInput field="confirm" />]);
        const [password, confirm] = getInputs();
        await fireEvent.update(password, 'a');
        await fireEvent.update(confirm, 'a');
        await flush();
        expect(container.querySelector(errorSelector)).toBeNull();
        await fireEvent.update(password, 'ab');
        await vi.waitFor(() => expect(container.querySelector(errorSelector)).toHaveTextContent('mismatch'));
    });

    it('从 semiGlobal overrideDefaultProps 读取 schema', async () => {
        semiGlobal.config.overrideDefaultProps = { Form: { schema: nameSchema } };
        const { api, container } = renderForm({}, nameInput);
        await expect(api().validate()).rejects.toEqual({ name: ['required'] });
        await vi.waitFor(() => expect(container.querySelector(errorSelector)).toHaveTextContent('required'));
    });

    it('接受函数形式的 schema，不产生 prop 类型警告', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const schema = Object.assign(() => undefined, { '~standard': { version: 1, vendor: 'test', validate: () => ({ issues: [{ message: 'invalid', path: ['name'] }] }) } });
        const { api } = renderForm({ schema }, nameInput);
        await expect(api().validate()).rejects.toEqual({ name: ['invalid'] });
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });
});
