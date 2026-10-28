/** @jsxImportSource vue */
import { defineComponent, nextTick } from 'vue';
import { fireEvent, waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render, sleep } from '@test/utils/vue';
import { ArrayField, Form, withField, type ArrayFieldSlotProps, type FormApi, type FormState } from '..';
import { FormInput, getInputs, renderForm } from './fixtures/fields';

const ObjectField = withField(
    defineComponent({
        props: { modelValue: { type: null, default: undefined } },
        setup: (props) => () => <span>{JSON.stringify(props.modelValue)}</span>,
    })
);

describe('Form 字段校验竞态', () => {
    it('慢的异步校验被更快的后续校验取代后，旧结果不写入', async () => {
        const validate = vi.fn<(value: string) => Promise<string | undefined>>((value) => sleep(value === 'a' ? 60 : 5).then(() => (value === 'a' ? 'old-err' : undefined)));
        const onErrorChange = vi.fn<(...args: unknown[]) => void>();
        const { api, container } = renderForm({ onErrorChange }, () => <FormInput field="name" validator={validate} />);
        const [input] = getInputs();
        await fireEvent.update(input, 'a');
        await fireEvent.update(input, 'ab');
        await sleep(100);
        expect(validate).toHaveBeenCalledTimes(2);
        expect(api().getError('name')).toBeUndefined();
        expect(container.querySelector('.semi-form-field-error-message')).toBeNull();
        expect(onErrorChange.mock.calls.some(([errors]) => JSON.stringify(errors).includes('old-err'))).toBe(false);
    });
});

describe('Form 字段提交回滚', () => {
    it('change 监听器抛错时不通知表单、不标记 touched、不触发校验', async () => {
        const onValueChange = vi.fn<(...args: unknown[]) => void>();
        const onFormChange = vi.fn<(...args: unknown[]) => void>();
        const validate = vi.fn<(value: unknown) => string | undefined>(() => undefined);
        const errors: unknown[] = [];
        let api: FormApi | undefined;
        const formProps = {
            initValues: { name: 'init' },
            onChange: onFormChange,
            onValueChange,
            onGetFormApi: (formApi: FormApi) => (api = formApi),
        };
        const fieldProps = {
            field: 'name',
            validator: validate,
            onChange: () => {
                throw new Error('rejected');
            },
        };
        // the errorHandler swallows the listener error, as a production app may
        const { container } = render(() => <Form {...formProps}>{() => <FormInput {...fieldProps} />}</Form>, {
            global: { config: { errorHandler: (error) => void errors.push(error) } },
        });
        const changesBefore = onFormChange.mock.calls.length;
        await fireEvent.update(container.querySelector('input') as HTMLInputElement, 'next');
        expect(errors).toHaveLength(1);
        expect(api?.getValue('name')).toBe('init');
        expect(container.querySelector('input')).toHaveValue('init');
        expect(api?.getTouched('name')).toBeUndefined();
        expect(onValueChange).not.toHaveBeenCalled();
        expect(onFormChange).toHaveBeenCalledTimes(changesBefore);
        expect(validate).not.toHaveBeenCalled();
    });
});

describe('ArrayField 行操作', () => {
    it('onAdd(index)、onRemove、onAddWithInitValue(index) 后表单值与渲染一致', async () => {
        let scope: ArrayFieldSlotProps | undefined;
        const { api } = renderForm({ initValues: { tasks: [{ name: 't0' }, { name: 't1' }] } }, () => (
            <ArrayField field="tasks">
                {{
                    default: (slotProps: ArrayFieldSlotProps) => {
                        scope = slotProps;
                        return slotProps.arrayFields.map(({ field, key }) => <FormInput key={key} field={`${field}.name`} />);
                    },
                }}
            </ArrayField>
        ));
        const rendered = () => getInputs().map((input) => input.value);
        const stored = () => (api().getValue('tasks') as Array<{ name?: string } | undefined>).map((row) => row?.name ?? '');

        scope?.onAdd(1);
        await nextTick();
        expect(rendered()).toEqual(['t0', '', 't1']);
        expect(stored()).toEqual(rendered());

        scope?.arrayFields[0].onRemove();
        await nextTick();
        expect(rendered()).toEqual(['', 't1']);
        expect(stored()).toEqual(rendered());

        scope?.onAddWithInitValue({ name: 'x' }, 1);
        await nextTick();
        expect(rendered()).toEqual(['', 'x', 't1']);
        expect(stored()).toEqual(rendered());
    });

    it('行内字段的 initValue 与 ArrayField 的 initValue 同时存在时，表单值与输入框一致', () => {
        const { api } = renderForm({}, () => (
            <ArrayField field="people" initValue={[{ name: 'a', id: 1 }]}>
                {{
                    default: ({ arrayFields }: ArrayFieldSlotProps) => arrayFields.map(({ field, key }) => <FormInput key={key} field={`${field}.name`} initValue="row-init" />),
                }}
            </ArrayField>
        ));
        expect(getInputs()[0]).toHaveValue('row-init');
        expect(api().getValue('people')).toEqual([{ name: 'row-init', id: 1 }]);
    });
});

describe('Form 注册与校验次数', () => {
    it('输入一次只校验一次，错误只上报一次', async () => {
        const validate = vi.fn<(value: unknown) => string>(() => 'err');
        const onErrorChange = vi.fn<(...args: unknown[]) => void>();
        const { api } = renderForm({ onErrorChange }, () => <FormInput field="name" validator={validate} />);
        await fireEvent.update(getInputs()[0], 'a');
        await waitFor(() => expect(onErrorChange).toHaveBeenCalledTimes(1));
        expect(validate).toHaveBeenCalledTimes(1);
        expect(api().getError('name')).toBe('err');
    });

    it('挂载校验的错误在表单状态与界面上一致', async () => {
        const { api, container } = renderForm({}, () => <FormInput field="name" trigger="mount" validator={() => 'mount-err'} />);
        await waitFor(() => expect(container.querySelector('.semi-form-field-error-message')).toHaveTextContent('mount-err'));
        expect(api().getError('name')).toBe('mount-err');
    });

    it('ArrayField 挂载只写入一次初始值', () => {
        const onValueChange = vi.fn<(...args: unknown[]) => void>();
        const { api } = renderForm({ onValueChange }, () => (
            <ArrayField field="people" initValue={[{ name: 'a' }, { name: 'b' }]}>
                {{
                    default: ({ arrayFields }: ArrayFieldSlotProps) => arrayFields.map(({ field, key }) => <FormInput key={key} field={`${field}.name`} />),
                }}
            </ArrayField>
        ));
        expect(getInputs().map((input) => input.value)).toEqual(['a', 'b']);
        expect(api().getValue('people')).toEqual([{ name: 'a' }, { name: 'b' }]);
        expect(onValueChange).not.toHaveBeenCalled();
    });
});

describe('Form 字段 initValue 拷贝', () => {
    it('initValue 只在初始化时拷贝，其他字段输入不再拷贝', async () => {
        let reads = 0;
        const initValue = {
            get name() {
                reads += 1;
                return 'init';
            },
        };
        renderForm({}, () => (
            <>
                <ObjectField field="obj" initValue={initValue} />
                <FormInput field="other" />
            </>
        ));
        const readsAfterMount = reads;
        const [input] = getInputs();
        await fireEvent.update(input, 'a');
        await fireEvent.update(input, 'ab');
        await fireEvent.update(input, 'abc');
        expect(reads).toBe(readsAfterMount);
    });

    it('改动 change 交出的 values 后，reset 仍恢复为 initValue', async () => {
        let latest: Record<string, any> = {};
        const { api } = renderForm({ onChange: (formState: FormState) => (latest = formState.values) }, () => (
            <>
                <ObjectField field="obj" initValue={{ name: 'init' }} />
                <FormInput field="other" />
            </>
        ));
        await fireEvent.update(getInputs()[0], 'a');
        latest.obj.name = 'mutated';
        api().reset();
        expect(api().getValue('obj')).toEqual({ name: 'init' });
    });
});
