/** @jsxImportSource vue */
import { h } from 'vue';
import { fireEvent, screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { sleep } from '@test/utils/vue';
import { FormInput, renderForm } from './fixtures/fields';

const rules = [
    { required: true, message: 'required' },
    { validator: () => false, message: 'second' },
];

describe('Form 字段规则', () => {
    it('rules 含 required 时控件带 aria-required', () => {
        renderForm({}, () => (
            <>
                <FormInput field="a" label="A" rules={[{ required: true }]} />
                <FormInput field="b" label="B" rules={[{ max: 3 }]} />
            </>
        ));
        expect(screen.getByRole('textbox', { name: 'A' })).toHaveAttribute('aria-required', 'true');
        expect(screen.getByRole('textbox', { name: 'B' })).not.toHaveAttribute('aria-required', 'true');
    });

    it('Form 的 stopValidateWithError 是字段的默认值，字段自身的设置优先', async () => {
        const { api } = renderForm({ stopValidateWithError: true }, () => (
            <>
                <FormInput field="inherit" rules={rules} />
                <FormInput field="own" rules={rules} stopValidateWithError={false} />
            </>
        ));
        await expect(api().validate()).rejects.toBeDefined();
        expect(api().getError('inherit')).toBe('required');
        expect(api().getError('own')).toEqual(['required', 'second']);
    });

    it('Form 的 trigger 是字段的默认值，字段自身的设置优先', async () => {
        const { api } = renderForm({ trigger: 'blur' }, () => (
            <>
                <FormInput field="inherit" label="Inherit" validator={() => 'inherit-err'} />
                <FormInput field="own" label="Own" trigger="change" validator={() => 'own-err'} />
            </>
        ));
        await fireEvent.update(screen.getByRole('textbox', { name: 'Inherit' }), 'x');
        await fireEvent.update(screen.getByRole('textbox', { name: 'Own' }), 'x');
        await sleep(10);
        expect(api().getError('inherit')).toBeUndefined();
        expect(api().getError('own')).toBe('own-err');
        await fireEvent.focusOut(screen.getByRole('textbox', { name: 'Inherit' }));
        await sleep(10);
        expect(api().getError('inherit')).toBe('inherit-err');
    });

    it('Form 的 extraTextPosition 是字段的默认值，字段自身的设置优先', () => {
        const { container } = renderForm({ extraTextPosition: 'middle' }, () => [h(FormInput, { field: 'inherit' }, { extraText: () => 'inherit' }), h(FormInput, { field: 'own', extraTextPosition: 'bottom' }, { extraText: () => 'own' })]);
        expect(container.querySelector(`[x-field-id="inherit"] .${BASE_CLASS_PREFIX}-form-field-extra-middle`)).toHaveTextContent('inherit');
        expect(container.querySelector(`[x-field-id="own"] .${BASE_CLASS_PREFIX}-form-field-extra-bottom`)).toHaveTextContent('own');
    });

    it('ArrayField 之外字段的 initValue 优先于 Form 的 initValues', () => {
        renderForm({ initValues: { name: 'form' } }, () => <FormInput field="name" label="Name" initValue="field" />);
        expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('field');
    });

    it('Form 拷贝值时保留函数与 Error 的引用', () => {
        const fn = () => 1;
        const error = new Error('e');
        const { api } = renderForm({ initValues: { fn, error } });
        const values = api().getValues();
        expect(values.fn).toBe(fn);
        expect(values.error).toBe(error);
    });

    it('Form 拷贝值时保留 VNode 的引用', () => {
        const node = h('span', 'node');
        const { api } = renderForm({ initValues: { node } });
        expect(api().getValues().node).toBe(node);
    });

    it('Form 拷贝值时保留越界数组的键', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const outOfBounds: unknown[] = [];
        (outOfBounds as unknown as Record<string, unknown>)['4294967295'] = 'x';
        const { api } = renderForm({ initValues: { outOfBounds } });
        const values = api().getValues();
        expect(values.outOfBounds).not.toBe(outOfBounds);
        expect(values.outOfBounds['4294967295']).toBe('x');
        warn.mockRestore();
    });
});
