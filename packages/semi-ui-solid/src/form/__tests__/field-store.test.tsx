import { For, createEffect, createSignal, on } from 'solid-js';
import { fireEvent, render, screen } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { type ArrayFieldChildrenProps, type FormApi, type FormProps, ArrayField, Form, useFieldState, useFormState, withField } from '..';

interface ControlProps {
    id?: string;
    name?: string;
    value?: string;
    validateStatus?: string;
    onChange?: (value: string) => void;
    onBlur?: (e: FocusEvent) => void;
}

function Control(props: ControlProps) {
    return <input id={props.id} name={props.name} data-status={props.validateStatus} data-value={JSON.stringify(props.value)} value={props.value ?? ''} onBlur={(e) => props.onBlur?.(e)} onInput={(e) => props.onChange?.(e.currentTarget.value)} />;
}

const Field = withField(Control);

function StateProbe(props: { field?: string }) {
    const formState = useFormState();
    const fieldState = useFieldState(() => props.field ?? 'name');
    return (
        <>
            <output data-testid="form-state">{JSON.stringify(formState())}</output>
            <output data-testid="field-state">{JSON.stringify(fieldState())}</output>
        </>
    );
}

const flush = () => new Promise((resolve) => setTimeout(resolve));

function EffectChangeControl(props: ControlProps & { emittedValue: string }) {
    createEffect(
        on(
            () => props.emittedValue,
            (value) => props.onChange?.(value)
        )
    );
    return <Control {...props} />;
}

const EffectChangeField = withField(EffectChangeControl);

describe('Form 字段状态与发布时机', () => {
    it('包装控件在 effect 中上报的 change 使用同一次更新的 convert', () => {
        let api: FormApi | undefined;
        const [config, setConfig] = createSignal({ emittedValue: 'first', suffix: '-old' });
        render(() => (
            <Form getFormApi={(value) => (api = value)}>
                <EffectChangeField convert={(value: string) => value + config().suffix} emittedValue={config().emittedValue} field="name" />
            </Form>
        ));
        setConfig({ emittedValue: 'second', suffix: '-new' });
        expect(api?.getValue('name')).toBe('second-new');
        expect(screen.getByRole('textbox')).toHaveValue('second-new');
    });

    it('包装控件在 effect 中上报的 change 使用同一次更新的空值配置', () => {
        let api: FormApi | undefined;
        const [config, setConfig] = createSignal({ emittedValue: 'first', emptyValue: 'old-empty', allowEmptyString: false });
        render(() => (
            <Form getFormApi={(value) => (api = value)}>
                <EffectChangeField allowEmptyString={config().allowEmptyString} emittedValue={config().emittedValue} emptyValue={config().emptyValue} field="name" />
            </Form>
        ));
        setConfig({ emittedValue: 'new-empty', emptyValue: 'new-empty', allowEmptyString: false });
        expect(api?.getValue('name')).toBeUndefined();
        setConfig({ emittedValue: 'last-empty', emptyValue: 'last-empty', allowEmptyString: true });
        expect(api?.getValue('name')).toBe('last-empty');
    });

    it('批量校验逐字段显示错误，整表订阅等全部校验结束才更新', async () => {
        const fast = Promise.withResolvers<string>();
        const slow = Promise.withResolvers<string>();
        const onChange = vi.fn<NonNullable<FormProps['onChange']>>();
        let api: FormApi | undefined;
        render(() => (
            <Form getFormApi={(value) => (api = value)} onChange={onChange}>
                <Field field="fast" validator={() => fast.promise} />
                <Field field="slow" validator={() => slow.promise} />
                <StateProbe field="fast" />
            </Form>
        ));
        const validation = api?.validate().catch((errors: unknown) => errors);
        fast.resolve('fast-error');
        await flush();
        expect(screen.getByText('fast-error')).toBeInTheDocument();
        expect(screen.queryByText('slow-error')).toBeNull();
        expect(api?.getError('fast')).toBe('fast-error');
        expect(screen.getByTestId('form-state')).toHaveTextContent('{"values":{},"errors":{},"touched":{}}');
        expect(screen.getByTestId('field-state')).toHaveTextContent('{}');
        expect(onChange).not.toHaveBeenCalled();

        slow.resolve('slow-error');
        await validation;
        await flush();
        expect(screen.getByText('slow-error')).toBeInTheDocument();
        expect(JSON.parse(screen.getByTestId('form-state').textContent ?? '')).toEqual({
            values: {},
            errors: { fast: 'fast-error', slow: 'slow-error' },
            touched: { fast: true, slow: true },
        });
        expect(JSON.parse(screen.getByTestId('field-state').textContent ?? '')).toEqual({ error: 'fast-error', touched: true });
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it.each(['field-init', ''])('控件创建时收到字段 initValue %j，注册不改写控件值', (initValue) => {
        const control = vi.fn<(props: ControlProps) => ReturnType<typeof Control>>(Control);
        const InitialField = withField(control);
        let api: FormApi | undefined;
        render(() => (
            <Form getFormApi={(value) => (api = value)} initValues={{ name: 'form-init' }}>
                <InitialField field="name" initValue={initValue} />
            </Form>
        ));
        expect(control.mock.calls[0][0].value).toBe(initValue);
        expect(screen.getByRole('textbox')).toHaveAttribute('data-value', JSON.stringify(initValue));
        expect(api?.getValue('name')).toBe(initValue === '' ? undefined : initValue);
    });

    it('status 随错误、规则成功和 reset 流转，但不进入公开状态', async () => {
        let api: FormApi | undefined;
        render(() => (
            <Form getFormApi={(value) => (api = value)}>
                <Field field="name" rules={[{ required: true, message: 'required' }]} />
                <StateProbe />
            </Form>
        ));
        const input = screen.getByRole('textbox');
        expect(input).not.toHaveAttribute('data-status');
        api?.setError('name', 'bad');
        expect(input).toHaveAttribute('data-status', 'error');
        api?.setError('name', undefined);
        expect(input).toHaveAttribute('data-status', 'success');
        api?.reset();
        expect(input).toHaveAttribute('data-status', 'default');
        api?.setValue('name', 'ok');
        await api?.validate();
        expect(input).toHaveAttribute('data-status', 'success');
        expect(api?.getFormState()).toEqual({ values: { name: 'ok' }, errors: {}, touched: { name: true } });
        expect(JSON.parse(screen.getByTestId('field-state').textContent ?? '')).toEqual({ value: 'ok', touched: true });
        await api?.validate({ silent: true });
        expect(input).toHaveAttribute('data-status', 'success');
    });

    it('validateStatus 只覆盖控件展示，不写入公开状态', () => {
        let api: FormApi | undefined;
        render(() => (
            <Form getFormApi={(value) => (api = value)}>
                <Field field="name" validateStatus="warning" />
            </Form>
        ));
        api?.setError('name', 'bad');
        expect(screen.getByRole('textbox')).toHaveAttribute('data-status', 'warning');
        expect(api?.getFormState()).toEqual({ values: {}, errors: { name: 'bad' }, touched: {} });
    });

    it('reset 使用最近一次注册时的 initValue，普通属性更新不替换初值，null 重置为 undefined', () => {
        let api: FormApi | undefined;
        const onValueChange = vi.fn<NonNullable<FormProps['onValueChange']>>();
        const onReset = vi.fn<NonNullable<FormProps['onReset']>>();
        const [field, setField] = createSignal('before');
        const [initValue, setInitValue] = createSignal<string | null>('first');
        render(() => (
            <Form getFormApi={(value) => (api = value)} onReset={onReset} onValueChange={onValueChange}>
                <Field field={field()} initValue={initValue()} />
            </Form>
        ));
        setInitValue('ignored');
        api?.reset();
        expect(screen.getByRole('textbox')).toHaveValue('first');
        setInitValue('renamed');
        setField('after');
        api?.reset();
        expect(screen.getByRole('textbox')).toHaveValue('renamed');
        setInitValue(null);
        setField('null-value');
        api?.reset();
        expect(screen.getByRole('textbox')).not.toHaveAttribute('data-value');
        expect(screen.getByRole('textbox')).toHaveAttribute('data-status', 'default');
        expect(api?.getFormState()).toEqual({ values: {}, errors: {}, touched: {} });
        expect(onValueChange).not.toHaveBeenCalled();
        expect(onReset).toHaveBeenCalledTimes(3);
    });

    it('尚未 touched 的字段改名后，blur 只写入新字段路径', () => {
        let api: FormApi | undefined;
        const [field, setField] = createSignal('before');
        render(() => (
            <Form getFormApi={(value) => (api = value)}>
                <Field field={field()} />
            </Form>
        ));
        setField('after');
        fireEvent.blur(screen.getByRole('textbox'));
        expect(api?.getFormState()).toEqual({ values: {}, errors: {}, touched: { after: true } });
    });

    it('字段改名携带值、错误和控件 status，已有 touched 不在新路径重新写入', () => {
        let api: FormApi | undefined;
        const [field, setField] = createSignal('before');
        render(() => (
            <Form getFormApi={(value) => (api = value)}>
                <Field field={field()} initValue="init" />
            </Form>
        ));
        api?.setValue('before', 'changed');
        api?.setError('before', 'carried-error');
        api?.setTouched('before', true);
        setField('after');
        const input = screen.getByRole('textbox');
        expect(input).toHaveValue('changed');
        expect(input).toHaveAttribute('data-status', 'error');
        expect(api?.getFormState()).toEqual({ values: { after: 'changed' }, errors: { after: 'carried-error' }, touched: {} });
        fireEvent.blur(input);
        expect(api?.getTouched('after')).toBeUndefined();
    });

    it('ArrayField 删除前行后，后行携带值、错误和控件 status，blur 不重写 touched', () => {
        let api: FormApi | undefined;
        let rows: ArrayFieldChildrenProps | undefined;
        render(() => (
            <Form getFormApi={(value) => (api = value)} initValues={{ rows: [{ name: 'first' }, { name: 'second' }] }}>
                <ArrayField field="rows">
                    {(props) => {
                        rows = props;
                        return <For each={props.arrayFields}>{(row) => <Field field={`${row.field}.name`} />}</For>;
                    }}
                </ArrayField>
            </Form>
        ));
        api?.setValue('rows[1].name', 'changed');
        api?.setError('rows[1].name', 'row-error');
        api?.setTouched('rows[1].name', true);
        rows?.arrayFields[0].remove();
        const input = screen.getByRole('textbox');
        expect(input).toHaveValue('changed');
        expect(input).toHaveAttribute('data-status', 'error');
        expect(api?.getValue('rows')).toEqual([{ name: 'changed' }]);
        expect(api?.getError('rows[0].name')).toBe('row-error');
        expect(api?.getTouched('rows[0].name')).toBeUndefined();
        fireEvent.blur(input);
        expect(api?.getTouched('rows[0].name')).toBeUndefined();
    });

    it('包装控件只创建一次，无关字段与自身字段的更新只改动绑定的属性', () => {
        const control = vi.fn<(props: ControlProps) => ReturnType<typeof Control>>(Control);
        const CountedField = withField(control);
        let api: FormApi | undefined;
        render(() => (
            <Form getFormApi={(value) => (api = value)} initValues={{ person: { name: 'before' } }}>
                <CountedField field="person.name" />
                <Field field="other" />
            </Form>
        ));
        api?.setValue('other', 'other-value');
        api?.setValue('person', { name: 'after' });
        expect(control).toHaveBeenCalledTimes(1);
        expect(screen.getAllByRole('textbox')[0]).toHaveValue('after');
    });
});
