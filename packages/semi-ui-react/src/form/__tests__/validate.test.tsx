import { StrictMode, useEffect } from 'react';
import { act, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { Form } from '@fibrae/semi-ui-react';
import type { FormApi } from '../interface';

function renderNameForm(props: Record<string, unknown> = {}, fieldProps: Record<string, unknown> = {}) {
    let api: FormApi;
    const utils = render(
        <Form
            getFormApi={(formApi) => {
                api = formApi;
            }}
            {...props}
        >
            <Form.Input field="name" rules={[{ required: true, message: 'req' }]} {...fieldProps} />
        </Form>
    );
    return { ...utils, getApi: () => api };
}

describe('Form 静默校验', () => {
    it('静默校验失败后填入有效值，再次静默校验与提交都通过', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const { container, getApi } = renderNameForm({ onSubmit });
        await expect(getApi().validate({ silent: true })).rejects.toBeTruthy();
        await userEvent.type(container.querySelector('input'), 'abc');
        expect(getApi().getFormState().errors).toEqual({});
        await expect(getApi().validate({ silent: true })).resolves.toEqual({ name: 'abc' });
        await act(async () => {
            getApi().submitForm();
        });
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('静默校验失败后 reset，formState.errors 为空', async () => {
        const { getApi } = renderNameForm();
        await expect(getApi().validate({ silent: true })).rejects.toBeTruthy();
        act(() => getApi().reset());
        expect(getApi().getFormState().errors).toEqual({});
    });

    it('静默校验不写 formState.errors，也不触发 onErrorChange', async () => {
        const onErrorChange = vi.fn<(...args: unknown[]) => void>();
        const { getApi } = renderNameForm({ onErrorChange });
        await expect(getApi().validate({ silent: true })).rejects.toEqual({ name: 'req' });
        expect(getApi().getFormState().errors).toEqual({});
        expect(onErrorChange).not.toHaveBeenCalled();
    });
});

describe('Form 校验被取代', () => {
    it('异步校验被后一次 change 校验取代后，validate 仍会 settle', async () => {
        // Validators settle only after typing, so the first one is always superseded however slow typing runs.
        const settlers: Array<() => void> = [];
        const validate = (value?: string) =>
            new Promise<string | undefined>((resolve) => {
                settlers.push(() => resolve(value ? undefined : 'req'));
            });
        const { container, getApi } = renderNameForm({}, { rules: undefined, validator: validate });
        const pending = getApi().validate();
        await userEvent.type(container.querySelector('input'), 'a');
        await act(async () => {
            settlers.forEach((settle) => settle());
        });
        const settled = await Promise.race([
            pending.then(
                () => 'resolved',
                () => 'rejected'
            ),
            new Promise((resolve) => {
                setTimeout(() => resolve('pending'), 2000);
            }),
        ]);
        expect(settled).toBe('resolved');
    });

    it('blur 发起的异步校验未结束时 setValue，结束后不把旧错误写回该字段', async () => {
        let settle: (error?: string) => void = () => {};
        const onErrorChange = vi.fn<(...args: unknown[]) => void>();
        const validator = () => new Promise<string | undefined>((resolve) => (settle = resolve));
        const { container, getApi } = renderNameForm({ onErrorChange }, { rules: undefined, trigger: 'blur', validator });
        await userEvent.click(container.querySelector('input'));
        await userEvent.tab();
        act(() => getApi().setValue('name', 'abcdef'));
        await act(async () => settle('err'));
        expect(getApi().getError('name')).toBeUndefined();
        expect(container.querySelector('input').getAttribute('aria-invalid')).not.toBe('true');
        expect(container).not.toHaveTextContent('err');
        expect(onErrorChange).not.toHaveBeenCalled();
    });
});

describe('Form 字段校验读取最新属性', () => {
    it('rerender 修改 transform 后，formApi.validate 使用新的 transform', async () => {
        const seen: unknown[] = [];
        let api: FormApi;
        const renderWith = (suffix: string) => (
            <Form
                getFormApi={(formApi) => {
                    api = formApi;
                }}
            >
                <Form.Input
                    field="name"
                    initValue="a"
                    transform={(value: string) => `${value}-${suffix}`}
                    validator={(value: unknown) => {
                        seen.push(value);
                        return undefined;
                    }}
                />
            </Form>
        );
        const { rerender } = render(renderWith('old'));
        rerender(renderWith('new'));
        await act(async () => {
            await api.validate();
        });
        expect(seen.at(-1)).toBe('a-new');
    });
});

describe('Form 表单级 validator', () => {
    it('先失败后通过，formState 快照不再保留旧错误，并触发一次 onChange', async () => {
        const validator = vi.fn<(values: unknown) => Record<string, string>>().mockReturnValueOnce({ name: 'x', orphan: 'y' }).mockReturnValue({});
        const onChange = vi.fn<(...args: unknown[]) => void>();
        let api: FormApi;
        const { container } = render(
            <Form
                getFormApi={(formApi) => {
                    api = formApi;
                }}
                validator={validator}
                onChange={onChange}
            >
                {({ formState }) => (
                    <>
                        <Form.Input field="name" />
                        <output>{JSON.stringify(formState.errors)}</output>
                    </>
                )}
            </Form>
        );
        await act(async () => {
            await api.validate().catch(() => undefined);
        });
        expect(container.querySelector('output')).toHaveTextContent('{"name":"x","orphan":"y"}');
        const changeCount = onChange.mock.calls.length;
        await act(async () => {
            await api.validate();
        });
        expect(container.querySelector('output')).toHaveTextContent('{}');
        expect(api.getFormState().errors).toEqual({});
        expect(onChange).toHaveBeenCalledTimes(changeCount + 1);
    });
});

describe('Form 卸载', () => {
    it('整个 Form 卸载时不触发 onChange', () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        const { unmount } = render(
            <Form onChange={onChange}>
                <Form.Input field="a" />
                <Form.Input field="b" />
            </Form>
        );
        unmount();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('StrictMode 下挂载不触发 onChange，字段仍已注册', () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        let api: FormApi;
        const { container } = render(
            <StrictMode>
                <Form
                    getFormApi={(formApi) => {
                        api = formApi;
                    }}
                    initValues={{ a: '1' }}
                    onChange={onChange}
                >
                    <Form.Input field="a" />
                </Form>
            </StrictMode>
        );
        expect(onChange).not.toHaveBeenCalled();
        expect(api.getFieldExist('a')).toBe(true);
        act(() => api.setValue('a', '2'));
        expect(container.querySelector('input')).toHaveValue('2');
    });

    it('useForm 搭配 keepState 字段，Form 卸载后 formState 为空', () => {
        let latest: { values?: unknown };
        const Host = ({ show }: { show: boolean }) => {
            const [api, formState] = Form.useForm();
            useEffect(() => {
                latest = formState;
            });
            return show ? (
                <Form form={api} initValues={{ a: '1' }}>
                    <Form.Input field="a" keepState />
                </Form>
            ) : null;
        };
        const { rerender } = render(<Host show />);
        expect(latest.values).toEqual({ a: '1' });
        rerender(<Host show={false} />);
        expect(latest.values).toEqual({});
    });
});

describe('Form 提交', () => {
    it('字段异步 validator reject 时，按校验失败调用一次 onSubmitFail，不调用 onSubmit', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const onSubmitFail = vi.fn<(...args: unknown[]) => void>();
        const { getApi } = renderNameForm({ onSubmit, onSubmitFail }, { rules: undefined, validator: () => Promise.reject('async-err') });
        await act(async () => {
            getApi().submitForm();
        });
        await vi.waitFor(() => expect(onSubmitFail).toHaveBeenCalledTimes(1));
        expect(onSubmitFail.mock.calls[0][0]).toEqual({ name: 'async-err' });
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('表单级异步 validator reject 时，调用一次 onSubmitFail', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const onSubmitFail = vi.fn<(...args: unknown[]) => void>();
        const { getApi } = renderNameForm({ onSubmit, onSubmitFail, validator: () => Promise.reject(new Error('server down')) }, { rules: undefined });
        await act(async () => {
            getApi().submitForm();
        });
        await vi.waitFor(() => expect(onSubmitFail).toHaveBeenCalledTimes(1));
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('onSubmit 抛出的异常不会被当成 onSubmitFail', async () => {
        const boom = new Error('boom');
        const onSubmit = () => {
            throw boom;
        };
        const onSubmitFail = vi.fn<(...args: unknown[]) => void>();
        let api: FormApi;
        render(
            <Form
                getFormApi={(formApi) => {
                    api = formApi;
                }}
                onSubmit={onSubmit}
                onSubmitFail={onSubmitFail}
            >
                <Form.Input field="a" />
            </Form>
        );
        // The thrown error surfaces as an unhandled rejection by design; the runner's own listener would fail the run
        const runnerListeners = process.listeners('unhandledRejection');
        process.removeAllListeners('unhandledRejection');
        const seen: unknown[] = [];
        const collect = (reason: unknown) => seen.push(reason);
        process.on('unhandledRejection', collect);
        try {
            api.submitForm();
            await new Promise((resolve) => {
                setTimeout(resolve, 50);
            });
        } finally {
            process.off('unhandledRejection', collect);
            runnerListeners.forEach((listener) => process.on('unhandledRejection', listener));
        }
        expect(onSubmitFail).not.toHaveBeenCalled();
        expect(seen).toEqual([boom]);
    });
});

describe('Form onErrorChange 触发次数', () => {
    it('两个字段校验失败与 reset 各触发一次，第二个参数带上全部变化的字段', async () => {
        const onErrorChange = vi.fn<(...args: unknown[]) => void>();
        let api: FormApi;
        render(
            <Form getFormApi={(formApi) => (api = formApi)} onErrorChange={onErrorChange}>
                <Form.Input field="a" rules={[{ required: true, message: 'a-req' }]} />
                <Form.Input field="b" rules={[{ required: true, message: 'b-req' }]} />
            </Form>
        );
        await act(() => expect(api.validate()).rejects.toEqual({ a: 'a-req', b: 'b-req' }));
        expect(onErrorChange).toHaveBeenCalledTimes(1);
        expect(onErrorChange).toHaveBeenLastCalledWith({ a: 'a-req', b: 'b-req' }, { a: 'a-req', b: 'b-req' });

        act(() => api.reset());
        expect(onErrorChange).toHaveBeenCalledTimes(2);
        expect(onErrorChange).toHaveBeenLastCalledWith({}, { a: undefined, b: undefined });
    });
});
