import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Form } from '@fibrae/semi-ui-react';
import type { FormApi } from '../interface';

const rules = [
    { required: true, message: 'required' },
    { validator: () => false, message: 'second' },
];

describe('Form 字段规则', () => {
    it('rules 含 required 时控件带 aria-required', () => {
        render(
            <Form>
                <Form.Input field="a" label="A" rules={[{ required: true }]} />
                <Form.Input field="b" label="B" rules={[{ max: 3 }]} />
            </Form>
        );
        expect(screen.getByRole('textbox', { name: 'A' })).toHaveAttribute('aria-required', 'true');
        expect(screen.getByRole('textbox', { name: 'B' })).not.toHaveAttribute('aria-required', 'true');
    });

    it('Form 的 stopValidateWithError 是字段的默认值，字段自身的设置优先', async () => {
        let formApi: FormApi;
        render(
            <Form getFormApi={(api) => (formApi = api)} stopValidateWithError>
                <Form.Input field="inherit" rules={rules} />
                <Form.Input field="own" rules={rules} stopValidateWithError={false} />
            </Form>
        );
        await act(() => expect(formApi.validate()).rejects.toBeDefined());
        expect(formApi.getError('inherit')).toBe('required');
        expect(formApi.getError('own')).toEqual(['required', 'second']);
    });

    it('Form 的 trigger 是字段的默认值，字段自身的设置优先', async () => {
        let formApi: FormApi;
        render(
            <Form getFormApi={(api) => (formApi = api)} trigger="blur">
                <Form.Input field="inherit" label="Inherit" validator={() => 'inherit-err'} />
                <Form.Input field="own" label="Own" trigger="change" validator={() => 'own-err'} />
            </Form>
        );
        await act(async () => {
            fireEvent.change(screen.getByRole('textbox', { name: 'Inherit' }), { target: { value: 'x' } });
            fireEvent.change(screen.getByRole('textbox', { name: 'Own' }), { target: { value: 'x' } });
        });
        expect(formApi.getError('inherit')).toBeUndefined();
        expect(formApi.getError('own')).toBe('own-err');
        await act(async () => {
            fireEvent.blur(screen.getByRole('textbox', { name: 'Inherit' }));
        });
        expect(formApi.getError('inherit')).toBe('inherit-err');
    });

    it('Form 的 extraTextPosition 是字段的默认值，字段自身的设置优先', () => {
        const { container } = render(
            <Form extraTextPosition="middle">
                <Form.Input extraText="inherit" field="inherit" />
                <Form.Input extraText="own" extraTextPosition="bottom" field="own" />
            </Form>
        );
        expect(container.querySelector(`[x-field-id="inherit"] .${BASE_CLASS_PREFIX}-form-field-extra-middle`)).toHaveTextContent('inherit');
        expect(container.querySelector(`[x-field-id="own"] .${BASE_CLASS_PREFIX}-form-field-extra-bottom`)).toHaveTextContent('own');
    });

    it('ArrayField 之外字段的 initValue 优先于 Form 的 initValues', () => {
        render(
            <Form initValues={{ name: 'form' }}>
                <Form.Input field="name" initValue="field" label="Name" />
            </Form>
        );
        expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('field');
    });

    it('Form 拷贝值时保留 React 元素、函数、Error 的引用与越界数组的键', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const element = <span>node</span>;
        const fn = () => 1;
        const error = new Error('e');
        const outOfBounds: unknown[] = [];
        (outOfBounds as unknown as Record<string, unknown>)['4294967295'] = 'x';
        let formApi: FormApi;
        render(<Form getFormApi={(api) => (formApi = api)} initValues={{ element, fn, error, outOfBounds }} />);
        const values = formApi.getValues();
        expect(values.element).toBe(element);
        expect(values.fn).toBe(fn);
        expect(values.error).toBe(error);
        expect(values.outOfBounds).not.toBe(outOfBounds);
        expect(values.outOfBounds['4294967295']).toBe('x');
        warn.mockRestore();
    });
});
