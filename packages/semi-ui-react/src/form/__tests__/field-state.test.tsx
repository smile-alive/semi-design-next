import { StrictMode, Suspense } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { Form, ArrayField, withField } from '@fibrae/semi-ui-react';
import { sleep } from '@test/utils/react';
import type { FormApi } from '../interface';

function changeInput(input: Element, value: string) {
    fireEvent.change(input, { target: { value } });
}

describe('Form 字段校验竞态', () => {
    it('慢的异步校验被更快的后续校验取代后，旧结果不写入', async () => {
        const validate = vi.fn<(value: string) => Promise<string | undefined>>((value) => sleep(value === 'a' ? 60 : 5).then(() => (value === 'a' ? 'old-err' : undefined)));
        const onErrorChange = vi.fn<(...args: unknown[]) => void>();
        let api: FormApi;
        const { container } = render(
            <Form getFormApi={(formApi) => (api = formApi)} onErrorChange={onErrorChange}>
                <Form.Input field="name" validator={validate} />
            </Form>
        );
        const input = container.querySelector('input');
        changeInput(input, 'a');
        changeInput(input, 'ab');
        await act(() => sleep(100));
        expect(validate).toHaveBeenCalledTimes(2);
        expect(api.getError('name')).toBeUndefined();
        expect(container.querySelector('.semi-form-field-error-message')).toBeNull();
        expect(onErrorChange.mock.calls.some(([errors]) => JSON.stringify(errors).includes('old-err'))).toBe(false);
    });
});

describe('Form 字段提交回滚', () => {
    it('onChange 抛错时不通知表单、不标记 touched、不触发校验', () => {
        const onValueChange = vi.fn<(...args: unknown[]) => void>();
        const onFormChange = vi.fn<(...args: unknown[]) => void>();
        const validate = vi.fn<(value: unknown) => string | undefined>(() => undefined);
        let api: FormApi;
        const { container } = render(
            <Form getFormApi={(formApi) => (api = formApi)} initValues={{ name: 'init' }} onChange={onFormChange} onValueChange={onValueChange}>
                <Form.Input
                    field="name"
                    validator={validate}
                    onChange={() => {
                        throw new Error('rejected');
                    }}
                />
            </Form>
        );
        const changesBefore = onFormChange.mock.calls.length;
        const onError = (e: ErrorEvent) => e.preventDefault();
        window.addEventListener('error', onError);
        try {
            changeInput(container.querySelector('input'), 'next');
        } catch {
            // React may rethrow the handler error synchronously in tests
        } finally {
            window.removeEventListener('error', onError);
        }
        expect(api.getValue('name')).toBe('init');
        expect(container.querySelector('input')).toHaveValue('init');
        expect(api.getTouched('name')).toBeUndefined();
        expect(onValueChange).not.toHaveBeenCalled();
        expect(onFormChange).toHaveBeenCalledTimes(changesBefore);
        expect(validate).not.toHaveBeenCalled();
    });
});

describe('ArrayField 行操作', () => {
    it('add(index)、remove、addWithInitValue(index) 后表单值与渲染一致', () => {
        let api: FormApi;
        let ops: { add: (index?: number) => void; addWithInitValue: (row: object, index?: number) => void };
        let removers: Array<() => void> = [];
        const { container } = render(
            <Form getFormApi={(formApi) => (api = formApi)} initValues={{ tasks: [{ name: 't0' }, { name: 't1' }] }}>
                <ArrayField field="tasks">
                    {({ add, addWithInitValue, arrayFields }) => {
                        ops = { add, addWithInitValue };
                        removers = arrayFields.map(({ remove }) => remove);
                        return arrayFields.map(({ field, key }) => <Form.Input key={key} field={`${field}.name`} />);
                    }}
                </ArrayField>
            </Form>
        );
        const rendered = () => [...container.querySelectorAll('input')].map((input) => input.value);
        const stored = () => (api.getValue('tasks') as Array<{ name?: string } | undefined>).map((row) => row?.name ?? '');

        act(() => ops.add(1));
        expect(rendered()).toEqual(['t0', '', 't1']);
        expect(stored()).toEqual(rendered());

        act(() => removers[0]());
        expect(rendered()).toEqual(['', 't1']);
        expect(stored()).toEqual(rendered());

        act(() => ops.addWithInitValue({ name: 'x' }, 1));
        expect(rendered()).toEqual(['', 'x', 't1']);
        expect(stored()).toEqual(rendered());
    });

    it('行内字段的 initValue 与 ArrayField 的 initValue 同时存在时，表单值与输入框一致', () => {
        let api: FormApi;
        const { container } = render(
            <Form getFormApi={(formApi) => (api = formApi)}>
                <ArrayField field="people" initValue={[{ name: 'a', id: 1 }]}>
                    {({ arrayFields }) => arrayFields.map(({ field, key }) => <Form.Input key={key} field={`${field}.name`} initValue="row-init" />)}
                </ArrayField>
            </Form>
        );
        expect(container.querySelector('input')).toHaveValue('row-init');
        expect(api.getValue('people')).toEqual([{ name: 'row-init', id: 1 }]);
    });

    it('首次渲染被 Suspense 丢弃后重新挂载，行内 initValue 仍生效', async () => {
        let resolved = false;
        let pending: Promise<void> | undefined;
        const Suspender = () => {
            if (!resolved) {
                pending ??= sleep(10).then(() => {
                    resolved = true;
                });
                throw pending;
            }
            return null;
        };
        let api: FormApi;
        render(
            <Form getFormApi={(formApi) => (api = formApi)}>
                <Suspense fallback={<span>loading</span>}>
                    <ArrayField field="people" initValue={[{ name: 'a' }]}>
                        {({ arrayFields }) => arrayFields.map(({ field, key }) => <Form.Input key={key} field={`${field}.name`} initValue="row-init" />)}
                    </ArrayField>
                    <Suspender />
                </Suspense>
            </Form>
        );
        expect(await screen.findByRole('textbox')).toHaveValue('row-init');
        expect(api.getValue('people')).toEqual([{ name: 'row-init' }]);
    });
});

describe('Form StrictMode', () => {
    it('输入一次只校验一次，错误只上报一次', () => {
        const validate = vi.fn<(value: unknown) => string>(() => 'err');
        const onErrorChange = vi.fn<(...args: unknown[]) => void>();
        let api: FormApi;
        const { container } = render(
            <StrictMode>
                <Form getFormApi={(formApi) => (api = formApi)} onErrorChange={onErrorChange}>
                    <Form.Input field="name" validator={validate} />
                </Form>
            </StrictMode>
        );
        changeInput(container.querySelector('input'), 'a');
        expect(validate).toHaveBeenCalledTimes(1);
        expect(onErrorChange).toHaveBeenCalledTimes(1);
        expect(api.getError('name')).toBe('err');
    });

    it('挂载校验的错误在表单状态与界面上一致', async () => {
        let api: FormApi;
        const { container } = render(
            <StrictMode>
                <Form getFormApi={(formApi) => (api = formApi)}>
                    <Form.Input field="name" trigger="mount" validator={() => 'mount-err'} />
                </Form>
            </StrictMode>
        );
        await waitFor(() => expect(container.querySelector('.semi-form-field-error-message')).toHaveTextContent('mount-err'));
        expect(api.getError('name')).toBe('mount-err');
    });

    it('ArrayField 挂载只写入一次初始值', () => {
        const onValueChange = vi.fn<(...args: unknown[]) => void>();
        let api: FormApi;
        const { container } = render(
            <StrictMode>
                <Form getFormApi={(formApi) => (api = formApi)} onValueChange={onValueChange}>
                    <ArrayField field="people" initValue={[{ name: 'a' }, { name: 'b' }]}>
                        {({ arrayFields }) => arrayFields.map(({ field, key }) => <Form.Input key={key} field={`${field}.name`} />)}
                    </ArrayField>
                </Form>
            </StrictMode>
        );
        expect([...container.querySelectorAll('input')].map((input) => input.value)).toEqual(['a', 'b']);
        expect(api.getValue('people')).toEqual([{ name: 'a' }, { name: 'b' }]);
        expect(onValueChange).not.toHaveBeenCalled();
    });
});

describe('Form 字段 initValue 拷贝', () => {
    const ObjectField = withField(({ value }: { value?: unknown }) => <span>{JSON.stringify(value)}</span>);

    it('initValue 只在初始化时拷贝，其他字段输入不再拷贝', () => {
        let reads = 0;
        const initValue = {
            get name() {
                reads += 1;
                return 'init';
            },
        };
        const { container } = render(
            <Form>
                <ObjectField field="obj" initValue={initValue} />
                <Form.Input field="other" />
            </Form>
        );
        const readsAfterMount = reads;
        const input = container.querySelector('input');
        changeInput(input, 'a');
        changeInput(input, 'ab');
        changeInput(input, 'abc');
        expect(reads).toBe(readsAfterMount);
    });

    it('改动 onChange 交出的 values 后，reset 仍恢复为 initValue', () => {
        let api: FormApi;
        let latest: Record<string, any>;
        const { container } = render(
            <Form getFormApi={(formApi) => (api = formApi)} onChange={(formState) => (latest = formState.values)}>
                <ObjectField field="obj" initValue={{ name: 'init' }} />
                <Form.Input field="other" />
            </Form>
        );
        changeInput(container.querySelector('input'), 'a');
        latest.obj.name = 'mutated';
        act(() => api.reset());
        expect(api.getValue('obj')).toEqual({ name: 'init' });
    });
});
