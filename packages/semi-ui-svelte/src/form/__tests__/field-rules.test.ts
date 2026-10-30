import { createRawSnippet } from 'svelte';
import { fireEvent, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { input, renderForm, sleep, typeInto } from './helpers';

const rules = [
    { required: true, message: 'required' },
    { validator: () => false, message: 'second' },
];

const text = (content: string) => createRawSnippet(() => ({ render: () => `<span>${content}</span>` }));

describe('Svelte Form 字段规则', () => {
    it('rules 含 required 时控件带 aria-required', () => {
        renderForm({}, [input('a', { label: 'A', rules: [{ required: true }] }), input('b', { label: 'B', rules: [{ max: 3 }] })]);
        expect(screen.getByRole('textbox', { name: 'A' })).toHaveAttribute('aria-required', 'true');
        expect(screen.getByRole('textbox', { name: 'B' })).not.toHaveAttribute('aria-required', 'true');
    });

    it('Form 的 stopValidateWithError 是字段的默认值，字段自身的设置优先', async () => {
        const { api } = renderForm({ stopValidateWithError: true }, [input('inherit', { rules }), input('own', { rules, stopValidateWithError: false })]);
        await expect(api().validate()).rejects.toBeDefined();
        expect(api().getError('inherit')).toBe('required');
        expect(api().getError('own')).toEqual(['required', 'second']);
    });

    it('Form 的 trigger 是字段的默认值，字段自身的设置优先', async () => {
        const { api } = renderForm({ trigger: 'blur' }, [input('inherit', { label: 'Inherit', validator: () => 'inherit-err' }), input('own', { label: 'Own', trigger: 'change', validator: () => 'own-err' })]);
        await typeInto(screen.getByRole('textbox', { name: 'Inherit' }) as HTMLInputElement, 'x');
        await typeInto(screen.getByRole('textbox', { name: 'Own' }) as HTMLInputElement, 'x');
        await sleep(10);
        expect(api().getError('inherit')).toBeUndefined();
        expect(api().getError('own')).toBe('own-err');
        await fireEvent.focusOut(screen.getByRole('textbox', { name: 'Inherit' }));
        await sleep(10);
        expect(api().getError('inherit')).toBe('inherit-err');
    });

    it('Form 的 extraTextPosition 是字段的默认值，字段自身的设置优先', () => {
        const { container } = renderForm({ extraTextPosition: 'middle' }, [input('inherit', { extraText: text('inherit') }), input('own', { extraTextPosition: 'bottom', extraText: text('own') })]);
        expect(container.querySelector('[x-field-id="inherit"] .semi-form-field-extra-middle')).toHaveTextContent('inherit');
        expect(container.querySelector('[x-field-id="own"] .semi-form-field-extra-bottom')).toHaveTextContent('own');
    });

    it('ArrayField 之外字段的 initValue 优先于 Form 的 initValues', () => {
        renderForm({ initValues: { name: 'form' } }, [input('name', { label: 'Name', initValue: 'field' })]);
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

    it('Form 拷贝值时保留 DOM 节点的引用', () => {
        const node = document.createElement('span');
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
