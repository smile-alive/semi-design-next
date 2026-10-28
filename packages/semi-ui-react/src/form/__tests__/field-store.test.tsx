import { Activity, useEffectEvent, useLayoutEffect, type FocusEventHandler } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { ArrayField, Form, useFieldState, useFormState, withField } from '@fibrae/semi-ui-react';
import type { FormApi } from '../interface';

interface ControlProps {
    id?: string;
    name?: string;
    value?: string;
    validateStatus?: string;
    onChange?: (value: string) => void;
    onBlur?: FocusEventHandler<HTMLInputElement>;
}

function Control({ id, name, value, validateStatus, onChange, onBlur }: ControlProps) {
    return <input id={id} name={name} data-status={validateStatus} data-value={JSON.stringify(value)} value={value ?? ''} onBlur={onBlur} onChange={(event) => onChange?.(event.target.value)} />;
}

const Field = withField(Control);

function LayoutChangeControl({ emittedValue, ...props }: ControlProps & { emittedValue: string }) {
    const emitChange = useEffectEvent(() => props.onChange?.(emittedValue));
    useLayoutEffect(() => {
        emitChange();
    }, [emittedValue]);
    return <Control {...props} />;
}

const LayoutChangeField = withField(LayoutChangeControl);

function StateProbe({ field = 'name' }: { field?: string }) {
    const formState = useFormState();
    const fieldState = useFieldState(field);
    return (
        <>
            <output data-testid="form-state">{JSON.stringify(formState)}</output>
            <output data-testid="field-state">{JSON.stringify(fieldState)}</output>
        </>
    );
}

describe('Form 字段状态与发布时机', () => {
    it('包装控件 layout effect 的 change 使用本次 render 的 convert', () => {
        let api: FormApi;
        const content = (emittedValue: string, suffix: string) => (
            <Form getFormApi={(value) => (api = value)}>
                <LayoutChangeField convert={(value: string) => value + suffix} emittedValue={emittedValue} field="name" />
            </Form>
        );
        const { rerender } = render(content('first', '-old'));
        rerender(content('second', '-new'));
        expect(api.getValue('name')).toBe('second-new');
        expect(screen.getByRole('textbox')).toHaveValue('second-new');
    });

    it('包装控件 layout effect 的 change 使用本次 render 的空值配置', () => {
        let api: FormApi;
        const content = (emittedValue: string, emptyValue: string, allowEmptyString: boolean) => (
            <Form getFormApi={(value) => (api = value)}>
                <LayoutChangeField allowEmptyString={allowEmptyString} emittedValue={emittedValue} emptyValue={emptyValue} field="name" />
            </Form>
        );
        const { rerender } = render(content('first', 'old-empty', false));
        rerender(content('new-empty', 'new-empty', false));
        expect(api.getValue('name')).toBeUndefined();
        rerender(content('last-empty', 'last-empty', true));
        expect(api.getValue('name')).toBe('last-empty');
    });

    it('批量校验逐字段显示错误，整表订阅等全部校验结束才更新', async () => {
        const fast = Promise.withResolvers<string>();
        const slow = Promise.withResolvers<string>();
        const onChange = vi.fn<NonNullable<Parameters<typeof Form>[0]['onChange']>>();
        let api: FormApi;
        render(
            <Form getFormApi={(value) => (api = value)} onChange={onChange}>
                <Field field="fast" validator={() => fast.promise} />
                <Field field="slow" validator={() => slow.promise} />
                <StateProbe field="fast" />
            </Form>
        );
        let validation: Promise<unknown>;
        act(() => {
            validation = api.validate().catch((errors: unknown) => errors);
        });
        await act(async () => {
            fast.resolve('fast-error');
            await fast.promise;
        });
        expect(screen.getByText('fast-error')).toBeInTheDocument();
        expect(screen.queryByText('slow-error')).toBeNull();
        expect(api.getError('fast')).toBe('fast-error');
        expect(screen.getByTestId('form-state')).toHaveTextContent('{"values":{},"errors":{},"touched":{}}');
        expect(screen.getByTestId('field-state')).toHaveTextContent('{}');
        expect(onChange).not.toHaveBeenCalled();

        await act(async () => {
            slow.resolve('slow-error');
            await validation;
        });
        expect(screen.getByText('slow-error')).toBeInTheDocument();
        expect(JSON.parse(screen.getByTestId('form-state').textContent)).toEqual({
            values: {},
            errors: { fast: 'fast-error', slow: 'slow-error' },
            touched: { fast: true, slow: true },
        });
        expect(JSON.parse(screen.getByTestId('field-state').textContent)).toEqual({
            error: 'fast-error',
            touched: true,
        });
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it.each(['field-init', ''])('首轮控件收到字段 initValue %j，注册不改写控件值', (initValue) => {
        const control = vi.fn<(props: ControlProps) => React.ReactNode>(Control);
        const InitialField = withField(control);
        let api: FormApi;
        render(
            <Form getFormApi={(value) => (api = value)} initValues={{ name: 'form-init' }}>
                <InitialField field="name" initValue={initValue} />
            </Form>
        );
        expect(control.mock.calls[0][0].value).toBe(initValue);
        expect(screen.getByRole('textbox')).toHaveAttribute('data-value', JSON.stringify(initValue));
        expect(api.getValue('name')).toBe(initValue === '' ? undefined : initValue);
    });

    it('status 随错误、规则成功和 reset 流转，但不进入公开状态', async () => {
        let api: FormApi;
        render(
            <Form getFormApi={(value) => (api = value)}>
                <Field field="name" rules={[{ required: true, message: 'required' }]} />
                <StateProbe />
            </Form>
        );
        const input = screen.getByRole('textbox');
        expect(input).not.toHaveAttribute('data-status');
        act(() => api.setError('name', 'bad'));
        expect(input).toHaveAttribute('data-status', 'error');
        act(() => api.setError('name', undefined));
        expect(input).toHaveAttribute('data-status', 'success');
        act(() => api.reset());
        expect(input).toHaveAttribute('data-status', 'default');
        act(() => api.setValue('name', 'ok'));
        await act(async () => {
            await api.validate();
        });
        expect(input).toHaveAttribute('data-status', 'success');
        expect(api.getFormState()).toEqual({ values: { name: 'ok' }, errors: {}, touched: { name: true } });
        expect(JSON.parse(screen.getByTestId('field-state').textContent)).toEqual({ value: 'ok', touched: true });
        await act(async () => {
            await api.validate({ silent: true });
        });
        expect(input).toHaveAttribute('data-status', 'success');
    });

    it('validateStatus 只覆盖控件展示，不写入公开状态', () => {
        let api: FormApi;
        render(
            <Form getFormApi={(value) => (api = value)}>
                <Field field="name" validateStatus="warning" />
            </Form>
        );
        act(() => api.setError('name', 'bad'));
        expect(screen.getByRole('textbox')).toHaveAttribute('data-status', 'warning');
        expect(api.getFormState()).toEqual({ values: {}, errors: { name: 'bad' }, touched: {} });
    });

    it('reset 使用最近一次注册时的 initValue，普通 props 更新不替换初值，null 重置为 undefined', () => {
        let api: FormApi;
        const onValueChange = vi.fn<NonNullable<Parameters<typeof Form>[0]['onValueChange']>>();
        const onReset = vi.fn<NonNullable<Parameters<typeof Form>[0]['onReset']>>();
        const content = (field: string, initValue: string | null) => (
            <Form getFormApi={(value) => (api = value)} onReset={onReset} onValueChange={onValueChange}>
                <Field field={field} initValue={initValue} />
            </Form>
        );
        const { rerender } = render(content('before', 'first'));
        rerender(content('before', 'ignored'));
        act(() => api.reset());
        expect(screen.getByRole('textbox')).toHaveValue('first');
        rerender(content('after', 'renamed'));
        act(() => api.reset());
        expect(screen.getByRole('textbox')).toHaveValue('renamed');
        rerender(content('null-value', null));
        act(() => api.reset());
        expect(screen.getByRole('textbox')).not.toHaveAttribute('data-value');
        expect(screen.getByRole('textbox')).toHaveAttribute('data-status', 'default');
        expect(api.getFormState()).toEqual({ values: {}, errors: {}, touched: {} });
        expect(onValueChange).not.toHaveBeenCalled();
        expect(onReset).toHaveBeenCalledTimes(3);
    });

    it('尚未 touched 的字段改名后，blur 只写入新字段路径', () => {
        let api: FormApi;
        const content = (field: string) => (
            <Form getFormApi={(value) => (api = value)}>
                <Field field={field} />
            </Form>
        );
        const { rerender } = render(content('before'));
        rerender(content('after'));
        fireEvent.blur(screen.getByRole('textbox'));
        expect(api.getFormState()).toEqual({ values: {}, errors: {}, touched: { after: true } });
    });

    it('字段改名携带值、错误和控件 status，已有 touched 不在新路径重新写入', () => {
        let api: FormApi;
        const content = (field: string) => (
            <Form getFormApi={(value) => (api = value)}>
                <Field field={field} initValue="init" />
            </Form>
        );
        const { rerender } = render(content('before'));
        act(() => {
            api.setValue('before', 'changed');
            api.setError('before', 'carried-error');
            api.setTouched('before', true);
        });
        rerender(content('after'));
        const input = screen.getByRole('textbox');
        expect(input).toHaveValue('changed');
        expect(input).toHaveAttribute('data-status', 'error');
        expect(api.getFormState()).toEqual({
            values: { after: 'changed' },
            errors: { after: 'carried-error' },
            touched: {},
        });
        fireEvent.blur(input);
        expect(api.getTouched('after')).toBeUndefined();
    });

    it('ArrayField 删除前行后，后行携带值、错误和控件 status，blur 不重写 touched', () => {
        let api: FormApi;
        let removeFirst: () => void;
        render(
            <Form getFormApi={(value) => (api = value)} initValues={{ rows: [{ name: 'first' }, { name: 'second' }] }}>
                <ArrayField field="rows">
                    {({ arrayFields }) => {
                        removeFirst = arrayFields[0].remove;
                        return arrayFields.map(({ field, key }) => <Field key={key} field={`${field}.name`} />);
                    }}
                </ArrayField>
            </Form>
        );
        act(() => {
            api.setValue('rows[1].name', 'changed');
            api.setError('rows[1].name', 'row-error');
            api.setTouched('rows[1].name', true);
        });
        act(() => removeFirst());
        const input = screen.getByRole('textbox');
        expect(input).toHaveValue('changed');
        expect(input).toHaveAttribute('data-status', 'error');
        expect(api.getValue('rows')).toEqual([{ name: 'changed' }]);
        expect(api.getError('rows[0].name')).toBe('row-error');
        expect(api.getTouched('rows[0].name')).toBeUndefined();
        fireEvent.blur(input);
        expect(api.getTouched('rows[0].name')).toBeUndefined();
    });

    it('Activity 隐藏会注销字段，再显示携带值、错误和控件 status', () => {
        let api: FormApi;
        const content = (mode: 'visible' | 'hidden') => (
            <Form getFormApi={(value) => (api = value)}>
                <Activity mode={mode}>
                    <Field field="name" initValue="init" />
                </Activity>
            </Form>
        );
        const { rerender } = render(content('visible'));
        act(() => {
            api.setValue('name', 'changed');
            api.setError('name', 'activity-error');
            api.setTouched('name', true);
        });
        rerender(content('hidden'));
        expect(api.getFieldExist('name')).toBe(false);
        expect(api.getFormState()).toEqual({ values: {}, errors: {}, touched: {} });
        rerender(content('visible'));
        const input = screen.getByRole('textbox');
        expect(input).toHaveValue('changed');
        expect(input).toHaveAttribute('data-status', 'error');
        expect(api.getFormState()).toEqual({
            values: { name: 'changed' },
            errors: { name: 'activity-error' },
            touched: {},
        });
        fireEvent.blur(input);
        expect(api.getTouched('name')).toBeUndefined();
    });

    it.each([false, true])('嵌套 setValue 保留控件渲染阶段，shouldMemo=%s', (shouldMemo) => {
        const control = vi.fn<(props: ControlProps) => React.ReactNode>(Control);
        const NestedField = withField(control, { shouldMemo });
        let api: FormApi;
        render(
            <Form getFormApi={(value) => (api = value)} initValues={{ person: { name: 'before' } }}>
                <NestedField field="person.name" />
            </Form>
        );
        control.mockClear();
        act(() => api.setValue('person', { name: 'after' }));
        expect(control.mock.calls.map(([props]) => props.value)).toEqual(shouldMemo ? ['after'] : ['before', 'after']);
        expect(screen.getByRole('textbox')).toHaveValue('after');
    });

    it.each([false, true])('无关字段与自身字段更新的包装控件渲染次数，shouldMemo=%s', (shouldMemo) => {
        const control = vi.fn<(props: ControlProps) => React.ReactNode>(Control);
        const CountedField = withField(control, { shouldMemo });
        let api: FormApi;
        render(
            <Form getFormApi={(value) => (api = value)}>
                <CountedField field="name" initValue="init" />
                <Field field="other" />
            </Form>
        );
        control.mockClear();
        act(() => api.setValue('other', 'other-value'));
        expect(control).toHaveBeenCalledTimes(shouldMemo ? 0 : 1);
        control.mockClear();
        act(() => api.setValue('name', 'next'));
        expect(control.mock.calls.map(([props]) => props.value)).toEqual(['next']);
    });
});
