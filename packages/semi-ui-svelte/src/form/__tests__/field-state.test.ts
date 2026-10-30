import { fireEvent, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import type { FormState } from '../interface';
import { getInput, input, renderForm, settle, sleep, typeInto } from './helpers';
import InitialControl from './initial-control.svelte';

const inputs = () => Array.from(document.querySelectorAll<HTMLInputElement>('input.semi-input'));

describe('Svelte Form 字段校验竞态', () => {
    it('慢的异步校验被更快的后续校验取代后，旧结果不写入', async () => {
        const validator = vi.fn<(value: string) => Promise<string | undefined>>((value) => sleep(value === 'a' ? 60 : 5).then(() => (value === 'a' ? 'old-err' : undefined)));
        const onErrorChange = vi.fn<(...args: unknown[]) => void>();
        const { api, container } = renderForm({ onErrorChange }, [input('name', { validator })]);
        await typeInto(getInput(), 'a');
        await typeInto(getInput(), 'ab');
        await sleep(100);
        expect(validator).toHaveBeenCalledTimes(2);
        expect(api().getError('name')).toBeUndefined();
        expect(container.querySelector('.semi-form-field-error-message')).toBeNull();
        expect(onErrorChange.mock.calls.some(([errors]) => JSON.stringify(errors).includes('old-err'))).toBe(false);
    });
});

describe('Svelte Form 字段提交回滚', () => {
    // the listener error still reaches the window, which a production page may swallow the same way
    it('onChange 抛错时不通知表单、不标记 touched、不触发校验', async () => {
        const swallow = (event: ErrorEvent) => event.preventDefault();
        window.addEventListener('error', swallow);
        const onValueChange = vi.fn<(...args: unknown[]) => void>();
        const onFormChange = vi.fn<(...args: unknown[]) => void>();
        const validator = vi.fn<(value: unknown) => string | undefined>(() => undefined);
        const onChange = () => {
            throw new Error('rejected');
        };
        const { api } = renderForm({ initValues: { name: 'init' }, onChange: onFormChange, onValueChange }, [input('name', { validator, onChange })]);
        const changesBefore = onFormChange.mock.calls.length;
        await typeInto(getInput(), 'next');
        await settle();
        window.removeEventListener('error', swallow);
        expect(api().getValue('name')).toBe('init');
        expect(api().getTouched('name')).toBeUndefined();
        expect(onValueChange).not.toHaveBeenCalled();
        expect(onFormChange).toHaveBeenCalledTimes(changesBefore);
        expect(validator).not.toHaveBeenCalled();
    });
});

describe('Svelte ArrayField 行操作', () => {
    it('onAdd(index)、onRemove、onAddWithInitValue(index) 后表单值与渲染一致', async () => {
        const { api } = renderForm({ initValues: { tasks: [{ name: 't0' }, { name: 't1' }] } }, [{ type: 'arrayRows', props: { field: 'tasks' } }]);
        const rendered = () => inputs().map((item) => item.value);
        const stored = () => (api().getValue('tasks') as Array<{ name?: string } | undefined>).map((row) => row?.name ?? '');
        await fireEvent.click(screen.getByRole('button', { name: '在第 1 行插入' }));
        await settle();
        expect(rendered()).toEqual(['t0', '', 't1']);
        expect(stored()).toEqual(rendered());
        await fireEvent.click(screen.getByRole('button', { name: '删除首行' }));
        await settle();
        expect(rendered()).toEqual(['', 't1']);
        expect(stored()).toEqual(rendered());
        await fireEvent.click(screen.getByRole('button', { name: '在第 1 行插入 x' }));
        await settle();
        expect(rendered()).toEqual(['', 'x', 't1']);
        expect(stored()).toEqual(rendered());
    });

    it('行内字段的 initValue 与 ArrayField 的 initValue 同时存在时，表单值与输入框一致', () => {
        const { api } = renderForm({}, [{ type: 'arrayRows', props: { field: 'people', initValue: [{ name: 'a', id: 1 }], rowInitValue: 'row-init' } }]);
        expect(inputs()[0]).toHaveValue('row-init');
        expect(api().getValue('people')).toEqual([{ name: 'row-init', id: 1 }]);
    });
});

describe('Svelte Form 注册与校验次数', () => {
    it('输入一次只校验一次，错误只上报一次', async () => {
        const validator = vi.fn<(value: unknown) => string>(() => 'err');
        const onErrorChange = vi.fn<(...args: unknown[]) => void>();
        const { api } = renderForm({ onErrorChange }, [input('name', { validator })]);
        await typeInto(getInput(), 'a');
        await waitFor(() => expect(onErrorChange).toHaveBeenCalledTimes(1));
        expect(validator).toHaveBeenCalledTimes(1);
        expect(api().getError('name')).toBe('err');
    });

    it('挂载校验的错误在表单状态与界面上一致', async () => {
        const { api, container } = renderForm({}, [input('name', { trigger: 'mount', validator: () => 'mount-err' })]);
        await waitFor(() => expect(container.querySelector('.semi-form-field-error-message')).toHaveTextContent('mount-err'));
        expect(api().getError('name')).toBe('mount-err');
    });

    it('ArrayField 挂载只写入一次初始值', () => {
        const onValueChange = vi.fn<(...args: unknown[]) => void>();
        const { api } = renderForm({ onValueChange }, [{ type: 'arrayRows', props: { field: 'people', initValue: [{ name: 'a' }, { name: 'b' }] } }]);
        expect(inputs().map((item) => item.value)).toEqual(['a', 'b']);
        expect(api().getValue('people')).toEqual([{ name: 'a' }, { name: 'b' }]);
        expect(onValueChange).not.toHaveBeenCalled();
    });
});

describe('Svelte Form 字段 initValue 拷贝', () => {
    it('initValue 只在初始化时拷贝，其他字段输入不再拷贝', async () => {
        let reads = 0;
        const initValue = {
            get name() {
                reads += 1;
                return 'init';
            },
        };
        renderForm({}, [{ type: 'field', props: { component: InitialControl, field: 'obj', initValue } }, input('other')]);
        const readsAfterMount = reads;
        await typeInto(getInput(), 'a');
        await typeInto(getInput(), 'ab');
        await typeInto(getInput(), 'abc');
        expect(reads).toBe(readsAfterMount);
    });

    it('改动 onChange 交出的 values 后，reset 仍恢复为 initValue', async () => {
        let latest: Record<string, any> = {};
        const { api } = renderForm({ onChange: (formState: FormState) => (latest = formState.values ?? {}) }, [{ type: 'field', props: { component: InitialControl, field: 'obj', initValue: { name: 'init' } } }, input('other')]);
        await typeInto(getInput(), 'a');
        latest.obj.name = 'mutated';
        api().reset();
        expect(api().getValue('obj')).toEqual({ name: 'init' });
    });
});
