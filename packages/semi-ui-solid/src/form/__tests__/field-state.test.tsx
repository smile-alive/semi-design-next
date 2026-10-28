import { For } from 'solid-js';
import { fireEvent, render, waitFor } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { sleep } from '@test/utils/solid';
import { type ArrayFieldChildrenProps, type FormApi, ArrayField, Form, FormInput, FormTextArea, withField } from '..';

function changeInput(input: Element, value: string) {
    fireEvent.input(input, { target: { value } });
}

describe('Form 字段校验竞态', () => {
    it('慢的异步校验被更快的后续校验取代后，旧结果不写入', async () => {
        const validate = vi.fn<(value: string) => Promise<string | undefined>>((value) => sleep(value === 'a' ? 60 : 5).then(() => (value === 'a' ? 'old-err' : undefined)));
        const onErrorChange = vi.fn<(...args: unknown[]) => void>();
        let api: FormApi | undefined;
        const { container } = render(() => (
            <Form getFormApi={(formApi) => (api = formApi)} onErrorChange={onErrorChange}>
                <FormInput field="name" validator={validate} />
            </Form>
        ));
        const input = container.querySelector('input') as HTMLInputElement;
        changeInput(input, 'a');
        changeInput(input, 'ab');
        await sleep(100);
        expect(validate).toHaveBeenCalledTimes(2);
        expect(api?.getError('name')).toBeUndefined();
        expect(container.querySelector('.semi-form-field-error-message')).toBeNull();
        expect(onErrorChange.mock.calls.some(([errors]) => JSON.stringify(errors).includes('old-err'))).toBe(false);
    });
});

describe('Form 字段提交回滚', () => {
    it('onChange 抛错时不通知表单、不标记 touched、不触发校验', () => {
        const onValueChange = vi.fn<(...args: unknown[]) => void>();
        const onFormChange = vi.fn<(...args: unknown[]) => void>();
        const validate = vi.fn<(value: unknown) => string | undefined>(() => undefined);
        let api: FormApi | undefined;
        const { container } = render(() => (
            <Form getFormApi={(formApi) => (api = formApi)} initValues={{ name: 'init' }} onChange={onFormChange} onValueChange={onValueChange}>
                <FormInput
                    field="name"
                    validator={validate}
                    onChange={() => {
                        throw new Error('rejected');
                    }}
                />
            </Form>
        ));
        const changesBefore = onFormChange.mock.calls.length;
        // the DOM reports a listener's error on window instead of throwing it to dispatchEvent
        const onError = vi.fn<(e: ErrorEvent) => void>((e) => e.preventDefault());
        window.addEventListener('error', onError);
        changeInput(container.querySelector('input') as HTMLInputElement, 'next');
        window.removeEventListener('error', onError);
        expect(onError.mock.calls[0][0].error).toEqual(new Error('rejected'));
        expect(api?.getValue('name')).toBe('init');
        expect(api?.getTouched('name')).toBeUndefined();
        expect(onValueChange).not.toHaveBeenCalled();
        expect(onFormChange).toHaveBeenCalledTimes(changesBefore);
        expect(validate).not.toHaveBeenCalled();
        expect(container.querySelector('input')).toHaveValue('init');
    });

    it('TextArea 的 onChange 抛错时文本框写回表单值', () => {
        let api: FormApi | undefined;
        const { container } = render(() => (
            <Form getFormApi={(formApi) => (api = formApi)} initValues={{ note: 'init' }}>
                <FormTextArea
                    field="note"
                    onChange={() => {
                        throw new Error('rejected');
                    }}
                />
            </Form>
        ));
        const onError = vi.fn<(e: ErrorEvent) => void>((e) => e.preventDefault());
        window.addEventListener('error', onError);
        changeInput(container.querySelector('textarea') as HTMLTextAreaElement, 'next');
        window.removeEventListener('error', onError);
        expect(onError).toHaveBeenCalledOnce();
        expect(api?.getValue('note')).toBe('init');
        expect(container.querySelector('textarea')).toHaveValue('init');
    });
});

describe('ArrayField 行操作', () => {
    it('add(index)、remove、addWithInitValue(index) 后表单值与渲染一致', () => {
        let api: FormApi | undefined;
        let ops: ArrayFieldChildrenProps | undefined;
        const { container } = render(() => (
            <Form getFormApi={(formApi) => (api = formApi)} initValues={{ tasks: [{ name: 't0' }, { name: 't1' }] }}>
                <ArrayField field="tasks">
                    {(props) => {
                        ops = props;
                        return <For each={props.arrayFields}>{(row) => <FormInput field={`${row.field}.name`} />}</For>;
                    }}
                </ArrayField>
            </Form>
        ));
        const rendered = () => [...container.querySelectorAll('input')].map((input) => input.value);
        const stored = () => ((api as FormApi).getValue('tasks') as Array<{ name?: string } | undefined>).map((row) => row?.name ?? '');

        ops?.add(1);
        expect(rendered()).toEqual(['t0', '', 't1']);
        expect(stored()).toEqual(rendered());

        ops?.arrayFields[0].remove();
        expect(rendered()).toEqual(['', 't1']);
        expect(stored()).toEqual(rendered());

        ops?.addWithInitValue({ name: 'x' }, 1);
        expect(rendered()).toEqual(['', 'x', 't1']);
        expect(stored()).toEqual(rendered());
    });

    it('行内字段的 initValue 与 ArrayField 的 initValue 同时存在时，表单值与输入框一致', () => {
        let api: FormApi | undefined;
        const { container } = render(() => (
            <Form getFormApi={(formApi) => (api = formApi)}>
                <ArrayField field="people" initValue={[{ name: 'a', id: 1 }]}>
                    {(props) => <For each={props.arrayFields}>{(row) => <FormInput field={`${row.field}.name`} initValue="row-init" />}</For>}
                </ArrayField>
            </Form>
        ));
        expect(container.querySelector('input')).toHaveValue('row-init');
        expect(api?.getValue('people')).toEqual([{ name: 'row-init', id: 1 }]);
    });
});

describe('Form 校验与挂载次数', () => {
    it('输入一次只校验一次，错误只上报一次', () => {
        const validate = vi.fn<(value: unknown) => string>(() => 'err');
        const onErrorChange = vi.fn<(...args: unknown[]) => void>();
        let api: FormApi | undefined;
        const { container } = render(() => (
            <Form getFormApi={(formApi) => (api = formApi)} onErrorChange={onErrorChange}>
                <FormInput field="name" validator={validate} />
            </Form>
        ));
        changeInput(container.querySelector('input') as HTMLInputElement, 'a');
        expect(validate).toHaveBeenCalledTimes(1);
        expect(onErrorChange).toHaveBeenCalledTimes(1);
        expect(api?.getError('name')).toBe('err');
    });

    it('挂载校验的错误在表单状态与界面上一致', async () => {
        let api: FormApi | undefined;
        const { container } = render(() => (
            <Form getFormApi={(formApi) => (api = formApi)}>
                <FormInput field="name" trigger="mount" validator={() => 'mount-err'} />
            </Form>
        ));
        await waitFor(() => expect(container.querySelector('.semi-form-field-error-message')).toHaveTextContent('mount-err'));
        expect(api?.getError('name')).toBe('mount-err');
    });

    it('ArrayField 挂载只写入一次初始值', () => {
        const onValueChange = vi.fn<(...args: unknown[]) => void>();
        let api: FormApi | undefined;
        const { container } = render(() => (
            <Form getFormApi={(formApi) => (api = formApi)} onValueChange={onValueChange}>
                <ArrayField field="people" initValue={[{ name: 'a' }, { name: 'b' }]}>
                    {(props) => <For each={props.arrayFields}>{(row) => <FormInput field={`${row.field}.name`} />}</For>}
                </ArrayField>
            </Form>
        ));
        expect([...container.querySelectorAll('input')].map((input) => input.value)).toEqual(['a', 'b']);
        expect(api?.getValue('people')).toEqual([{ name: 'a' }, { name: 'b' }]);
        expect(onValueChange).not.toHaveBeenCalled();
    });
});

describe('Form 字段 initValue 拷贝', () => {
    const ObjectField = withField((props: { value?: unknown }) => <span>{JSON.stringify(props.value)}</span>);

    it('initValue 只在初始化时拷贝，其他字段输入不再拷贝', () => {
        let reads = 0;
        const initValue = {
            get name() {
                reads += 1;
                return 'init';
            },
        };
        const { container } = render(() => (
            <Form>
                <ObjectField field="obj" initValue={initValue} />
                <FormInput field="other" />
            </Form>
        ));
        const readsAfterMount = reads;
        const input = container.querySelector('input') as HTMLInputElement;
        changeInput(input, 'a');
        changeInput(input, 'ab');
        changeInput(input, 'abc');
        expect(reads).toBe(readsAfterMount);
    });

    it('改动 onChange 交出的 values 后，reset 仍恢复为 initValue', () => {
        let api: FormApi | undefined;
        let latest: Record<string, any> = {};
        const { container } = render(() => (
            <Form getFormApi={(formApi) => (api = formApi)} onChange={(formState) => (latest = formState.values)}>
                <ObjectField field="obj" initValue={{ name: 'init' }} />
                <FormInput field="other" />
            </Form>
        ));
        changeInput(container.querySelector('input') as HTMLInputElement, 'a');
        latest.obj.name = 'mutated';
        api?.reset();
        expect(api?.getValue('obj')).toEqual({ name: 'init' });
    });
});
