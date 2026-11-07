/** @jsxImportSource vue */
import { nextTick } from 'vue';
import { fireEvent, screen } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import * as z from 'zod';
import { errorSelector, flush, FormInput, getInput, labelSelector, renderForm } from './fixtures/fields';

describe('字段 validator 与 rules', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('validator 接受 Standard Schema，用它的问题作为字段错误', async () => {
        const { api, container } = renderForm({}, () => <FormInput field="name" validator={z.string().min(3, 'too short')} />);
        await fireEvent.update(getInput(), 'ab');
        await vi.waitFor(() => expect(container.querySelector(errorSelector)).toHaveTextContent('too short'));
        expect(api().getError('name')).toEqual(['too short']);
        await fireEvent.update(getInput(), 'abc');
        await vi.waitFor(() => expect(container.querySelector(errorSelector)).toBeNull());
    });

    it('同时传 rules 与 validator 时警告一次，validator 生效', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const both = { rules: [{ required: true, message: 'from rules' }], validator: () => 'from validator' };
        const { api } = renderForm({}, () => (
            // @ts-expect-error rules and validator are exclusive; the runtime still has to warn and pick one
            <FormInput field="name" {...both} />
        ));
        await expect(api().validate()).rejects.toEqual({ name: ['from validator'] });
        const messages = warn.mock.calls.map(([message]) => String(message)).filter((message) => message.includes('exclusive'));
        expect(messages).toEqual(['Warning: [Semi Form] the rules and validator of field "name" are exclusive; validator is used']);
    });

    it('错误数组用逗号连接显示，消息为空的规则只标记失败', async () => {
        const { api, container } = renderForm({}, () => [<FormInput field="many" validator={() => ['a', 'b']} />, <FormInput field="silent" label="Silent" rules={[{ required: true, message: '' }]} />]);
        await expect(api().validate()).rejects.toEqual({ many: ['a', 'b'], silent: [''] });
        await nextTick();
        expect(container.querySelector(`[x-field-id="many"] ${errorSelector}`)).toHaveTextContent(/^a, b$/);
        expect(container.querySelector(`[x-field-id="silent"] ${errorSelector}`)).toBeNull();
        expect(screen.getByRole('textbox', { name: 'Silent' })).toHaveAttribute('aria-invalid', 'true');
    });

    it('有 Form schema 时，必填星号与 aria-required 只看 label.required', () => {
        const schema = z.object({ a: z.string(), b: z.string() });
        const { container } = renderForm({ schema }, () => [<FormInput field="a" label="A" rules={[{ required: true }]} />, <FormInput field="b" label={{ text: 'B', required: true }} />]);
        expect(screen.getByRole('textbox', { name: 'A' })).toHaveAttribute('aria-required', 'false');
        expect(screen.getByRole('textbox', { name: 'B' })).toHaveAttribute('aria-required', 'true');
        const labels = container.querySelectorAll(labelSelector);
        expect(labels[0]).not.toHaveClass('semi-form-field-label-required');
        expect(labels[1]).toHaveClass('semi-form-field-label-required');
    });

    it('schemaDebounce 推迟输入触发的 schema 校验，validate 立即校验', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        const schema = z.object({ name: z.string().min(3, 'too short') });
        const { api, container } = renderForm({ schema, schemaDebounce: 300 }, () => <FormInput field="name" />);
        await fireEvent.update(getInput(), 'a');
        await vi.advanceTimersByTimeAsync(200);
        await fireEvent.update(getInput(), 'ab');
        await vi.advanceTimersByTimeAsync(299);
        expect(container.querySelector(errorSelector)).toBeNull();
        await vi.advanceTimersByTimeAsync(1);
        await nextTick();
        expect(container.querySelector(errorSelector)).toHaveTextContent('too short');
        await fireEvent.update(getInput(), 'b');
        await expect(api().validate()).rejects.toEqual({ name: ['too short'] });
        vi.useRealTimers();
        await flush();
    });
});
