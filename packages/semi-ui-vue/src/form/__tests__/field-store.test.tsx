/** @jsxImportSource vue */
import { defineComponent, h, KeepAlive, nextTick, onMounted, onUpdated, ref, watch } from 'vue';
import { fireEvent, screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import { ArrayField, Form, useFieldState, useFormState, withField, type ArrayFieldSlotProps, type FormApi, type FormState } from '..';
import { renderForm } from './fixtures/fields';

const controlProps = {
    id: String,
    name: String,
    modelValue: { type: null, default: undefined },
    validateStatus: String,
    emptyValue: String,
};

const Control = defineComponent({
    props: controlProps,
    emits: ['change', 'blur'],
    setup(props, { emit }) {
        return () => <input id={props.id} name={props.name} data-status={props.validateStatus} data-value={JSON.stringify(props.modelValue)} value={props.modelValue ?? ''} onBlur={(event: FocusEvent) => emit('blur', event)} onInput={(event: Event) => emit('change', (event.target as HTMLInputElement).value)} />;
    },
});

const Field = withField(Control);

const MountChangeField = withField(
    defineComponent({
        props: { ...controlProps, emittedValue: { type: String, required: true } },
        emits: ['change'],
        setup(props, { emit }) {
            onMounted(() => emit('change', props.emittedValue));
            watch(
                () => props.emittedValue,
                (value) => emit('change', value),
                { flush: 'post' }
            );
            return () => <input value={props.modelValue ?? ''} readonly />;
        },
    })
);

const StateProbe = defineComponent({
    props: { field: { type: String, default: 'name' } },
    setup(props) {
        const formState = useFormState();
        const fieldState = useFieldState(() => props.field);
        return () => (
            <>
                <output data-testid="form-state">{JSON.stringify(formState.value)}</output>
                <output data-testid="field-state">{JSON.stringify(fieldState.value)}</output>
            </>
        );
    },
});

function countedField() {
    const values: unknown[] = [];
    const Counted = defineComponent({
        props: controlProps,
        setup(props) {
            onUpdated(() => values.push(props.modelValue));
            return () => <input value={props.modelValue ?? ''} readonly />;
        },
    });
    return { CountedField: withField(Counted), values };
}

const textbox = () => screen.getByRole('textbox');

describe('Form 字段状态与发布时机', () => {
    it('被包装组件 onMounted 中与之后发出的 change 使用当前的 convert', async () => {
        const { api, rerender } = renderFieldWithProps({
            convert: (value: string) => value + '-old',
            emittedValue: 'first',
        });
        expect(api().getValue('name')).toBe('first-old');
        await rerender({ convert: (value: string) => value + '-new', emittedValue: 'second' });
        expect(api().getValue('name')).toBe('second-new');
        expect(textbox()).toHaveValue('second-new');
    });

    it('被包装组件发出的 change 使用当前的空值配置', async () => {
        const { api, rerender } = renderFieldWithProps({
            allowEmptyString: false,
            emittedValue: 'first',
            emptyValue: 'old-empty',
        });
        await rerender({ allowEmptyString: false, emittedValue: 'new-empty', emptyValue: 'new-empty' });
        expect(api().getValue('name')).toBeUndefined();
        await rerender({ allowEmptyString: true, emittedValue: 'last-empty', emptyValue: 'last-empty' });
        expect(api().getValue('name')).toBe('last-empty');
    });

    it('批量校验逐字段显示错误，整表订阅等全部校验结束才更新', async () => {
        const fast = Promise.withResolvers<string>();
        const slow = Promise.withResolvers<string>();
        const onChange = vi.fn<(formState: FormState) => void>();
        const { api } = renderForm({ onChange }, () => (
            <>
                <Field field="fast" validator={() => fast.promise} />
                <Field field="slow" validator={() => slow.promise} />
                <StateProbe field="fast" />
            </>
        ));
        const validation = api()
            .validate()
            .catch((errors: unknown) => errors);
        fast.resolve('fast-error');
        await fast.promise;
        await nextTick();
        expect(screen.getByText('fast-error')).toBeInTheDocument();
        expect(screen.queryByText('slow-error')).toBeNull();
        expect(api().getError('fast')).toBe('fast-error');
        expect(screen.getByTestId('form-state')).toHaveTextContent('{"values":{},"errors":{},"touched":{}}');
        expect(screen.getByTestId('field-state')).toHaveTextContent('{}');
        expect(onChange).not.toHaveBeenCalled();

        slow.resolve('slow-error');
        await validation;
        await nextTick();
        expect(screen.getByText('slow-error')).toBeInTheDocument();
        expect(JSON.parse(screen.getByTestId('form-state').textContent ?? '')).toEqual({
            values: {},
            errors: { fast: 'fast-error', slow: 'slow-error' },
            touched: { fast: true, slow: true },
        });
        expect(JSON.parse(screen.getByTestId('field-state').textContent ?? '')).toEqual({
            error: 'fast-error',
            touched: true,
        });
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it.each(['field-init', ''])('首轮控件收到字段 initValue %j，注册不改写控件值', (initValue) => {
        const firstValues: unknown[] = [];
        const InitialField = withField(
            defineComponent({
                props: controlProps,
                setup(props) {
                    firstValues.push(props.modelValue);
                    return () => <input data-value={JSON.stringify(props.modelValue)} readonly />;
                },
            })
        );
        const { api } = renderForm({ initValues: { name: 'form-init' } }, () => <InitialField field="name" initValue={initValue} />);
        expect(firstValues).toEqual([initValue]);
        expect(textbox()).toHaveAttribute('data-value', JSON.stringify(initValue));
        expect(api().getValue('name')).toBe(initValue === '' ? undefined : initValue);
    });

    it('status 随错误、规则成功和 reset 流转，但不进入公开状态', async () => {
        const { api } = renderForm({}, () => (
            <>
                <Field field="name" rules={[{ required: true, message: 'required' }]} />
                <StateProbe />
            </>
        ));
        const input = textbox();
        expect(input).not.toHaveAttribute('data-status');
        api().setError('name', 'bad');
        await nextTick();
        expect(input).toHaveAttribute('data-status', 'error');
        api().setError('name', undefined);
        await nextTick();
        expect(input).toHaveAttribute('data-status', 'success');
        api().reset();
        await nextTick();
        expect(input).toHaveAttribute('data-status', 'default');
        api().setValue('name', 'ok');
        await api().validate();
        await nextTick();
        expect(input).toHaveAttribute('data-status', 'success');
        expect(api().getFormState()).toEqual({ values: { name: 'ok' }, errors: {}, touched: { name: true } });
        expect(JSON.parse(screen.getByTestId('field-state').textContent ?? '')).toEqual({ value: 'ok', touched: true });
        await api().validate({ silent: true });
        await nextTick();
        expect(input).toHaveAttribute('data-status', 'success');
    });

    it('validateStatus 只覆盖控件展示，不写入公开状态', async () => {
        const { api } = renderForm({}, () => <Field field="name" validateStatus="warning" />);
        api().setError('name', 'bad');
        await nextTick();
        expect(textbox()).toHaveAttribute('data-status', 'warning');
        expect(api().getFormState()).toEqual({ values: {}, errors: { name: 'bad' }, touched: {} });
    });

    it('reset 使用最近一次注册时的 initValue，普通属性更新不替换初值，null 重置为 undefined', async () => {
        const onValueChange = vi.fn<(...args: unknown[]) => void>();
        const onReset = vi.fn<() => void>();
        const { api, rerender } = renderFieldWithProps({ field: 'before', initValue: 'first' }, { onReset, onValueChange }, Field);
        await rerender({ field: 'before', initValue: 'ignored' });
        api().reset();
        await nextTick();
        expect(textbox()).toHaveValue('first');
        await rerender({ field: 'after', initValue: 'renamed' });
        api().reset();
        await nextTick();
        expect(textbox()).toHaveValue('renamed');
        await rerender({ field: 'null-value', initValue: null });
        api().reset();
        await nextTick();
        expect(textbox()).not.toHaveAttribute('data-value');
        expect(textbox()).toHaveAttribute('data-status', 'default');
        expect(api().getFormState()).toEqual({ values: {}, errors: {}, touched: {} });
        expect(onValueChange).not.toHaveBeenCalled();
        expect(onReset).toHaveBeenCalledTimes(3);
    });

    it('尚未 touched 的字段改名后，blur 只写入新字段路径', async () => {
        const { api, rerender } = renderFieldWithProps({ field: 'before' }, {}, Field);
        await rerender({ field: 'after' });
        await fireEvent.blur(textbox());
        expect(api().getFormState()).toEqual({ values: {}, errors: {}, touched: { after: true } });
    });

    it('字段改名携带值、错误和控件 status，已有 touched 不在新路径重新写入', async () => {
        const { api, rerender } = renderFieldWithProps({ field: 'before', initValue: 'init' }, {}, Field);
        api().setValue('before', 'changed');
        api().setError('before', 'carried-error');
        api().setTouched('before', true);
        await rerender({ field: 'after', initValue: 'init' });
        const input = textbox();
        expect(input).toHaveValue('changed');
        expect(input).toHaveAttribute('data-status', 'error');
        expect(api().getFormState()).toEqual({
            values: { after: 'changed' },
            errors: { after: 'carried-error' },
            touched: {},
        });
        await fireEvent.blur(input);
        expect(api().getTouched('after')).toBeUndefined();
    });

    it('ArrayField 删除前行后，后行携带值、错误和控件 status，blur 不重写 touched', async () => {
        let scope: ArrayFieldSlotProps | undefined;
        const { api } = renderForm({ initValues: { rows: [{ name: 'first' }, { name: 'second' }] } }, () => (
            <ArrayField field="rows">
                {{
                    default: (slotProps: ArrayFieldSlotProps) => {
                        scope = slotProps;
                        return slotProps.arrayFields.map(({ field, key }) => <Field key={key} field={`${field}.name`} />);
                    },
                }}
            </ArrayField>
        ));
        api().setValue('rows[1].name', 'changed');
        api().setError('rows[1].name', 'row-error');
        api().setTouched('rows[1].name', true);
        await nextTick();
        scope?.arrayFields[0].onRemove();
        await nextTick();
        const input = textbox();
        expect(input).toHaveValue('changed');
        expect(input).toHaveAttribute('data-status', 'error');
        expect(api().getValue('rows')).toEqual([{ name: 'changed' }]);
        expect(api().getError('rows[0].name')).toBe('row-error');
        expect(api().getTouched('rows[0].name')).toBeUndefined();
        await fireEvent.blur(input);
        expect(api().getTouched('rows[0].name')).toBeUndefined();
    });

    it('KeepAlive 停用会注销字段，再激活携带值、错误和控件 status', async () => {
        let api: FormApi | undefined;
        const visible = ref(true);
        const Other = defineComponent(() => () => <span>other</span>);
        const Wrapped = defineComponent(() => () => <Field field="name" initValue="init" />);
        render(() => <Form onGetFormApi={(formApi: FormApi) => (api = formApi)}>{() => <KeepAlive>{() => (visible.value ? <Wrapped key="field" /> : <Other key="other" />)}</KeepAlive>}</Form>);
        api?.setValue('name', 'changed');
        api?.setError('name', 'keep-alive-error');
        api?.setTouched('name', true);
        visible.value = false;
        await nextTick();
        expect(api?.getFieldExist('name')).toBe(false);
        expect(api?.getFormState()).toEqual({ values: {}, errors: {}, touched: {} });
        visible.value = true;
        await nextTick();
        const input = textbox();
        expect(input).toHaveValue('changed');
        expect(input).toHaveAttribute('data-status', 'error');
        expect(api?.getFormState()).toEqual({
            values: { name: 'changed' },
            errors: { name: 'keep-alive-error' },
            touched: {},
        });
        await fireEvent.blur(input);
        expect(api?.getTouched('name')).toBeUndefined();
    });

    it('嵌套 setValue 后控件只以新值渲染一次', async () => {
        const { CountedField, values } = countedField();
        const { api } = renderForm({ initValues: { person: { name: 'before' } } }, () => <CountedField field="person.name" />);
        api().setValue('person', { name: 'after' });
        await nextTick();
        expect(values).toEqual(['after']);
        expect(textbox()).toHaveValue('after');
    });

    it('无关字段更新不重新渲染包装控件，自身字段更新渲染一次', async () => {
        const { CountedField, values } = countedField();
        const { api } = renderForm({}, () => (
            <>
                <CountedField field="name" initValue="init" />
                <Field field="other" />
            </>
        ));
        api().setValue('other', 'other-value');
        await nextTick();
        expect(values).toHaveLength(0);
        api().setValue('name', 'next');
        await nextTick();
        expect(values).toEqual(['next']);
    });
});

/** Renders one field named `name` (unless props say otherwise) whose props `rerender` replaces */
function renderFieldWithProps(fieldProps: Record<string, unknown>, formProps: Record<string, unknown> = {}, component: unknown = MountChangeField) {
    let api: FormApi | undefined;
    const Demo = defineComponent({
        props: { fieldProps: { type: Object, required: true } },
        setup: (props) => () => (
            <Form {...formProps} onGetFormApi={(formApi: FormApi) => (api = formApi)}>
                {() => h(component as typeof Field, { field: 'name', ...props.fieldProps })}
            </Form>
        ),
    });
    const view = render(Demo, { props: { fieldProps } });
    return {
        api: () => api as FormApi,
        rerender: (next: Record<string, unknown>) => view.rerender({ fieldProps: next }),
    };
}
