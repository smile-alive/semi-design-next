import { flushSync } from 'svelte';
import { fireEvent, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import type { FormState } from '../interface';
import CountedControl from './counted-control.svelte';
import { renderForm, settle } from './helpers';
import InitialControl from './initial-control.svelte';
import MountChangeControl from './mount-change-control.svelte';
import ProbeControl from './probe-control.svelte';

const textbox = () => screen.getByRole('textbox');

/** One FormField named `name` (unless the props say otherwise); `rerender` replaces its props */
function renderField(fieldProps: Record<string, unknown>, formProps: Record<string, unknown> = {}, component: unknown = MountChangeControl) {
    const view = renderForm(formProps, [{ type: 'field', props: { field: 'name', component, ...fieldProps } }]);
    return {
        ...view,
        rerender: async (next: Record<string, unknown>) => {
            view.store.fields[0].props = { field: 'name', component, ...next };
            await settle();
        },
    };
}

function countedField() {
    const values: unknown[] = [];
    return { values, props: { component: CountedControl, onUpdate: (value: unknown) => values.push(value) } };
}

describe('Svelte Form 字段状态与发布时机', () => {
    it('被包装组件 onMount 中与之后发出的 change 使用当前的 convert', async () => {
        const { api, rerender } = renderField({ convert: (value: string) => `${value}-old`, emittedValue: 'first' });
        expect(api().getValue('name')).toBe('first-old');
        await rerender({ convert: (value: string) => `${value}-new`, emittedValue: 'second' });
        expect(api().getValue('name')).toBe('second-new');
        expect(textbox()).toHaveValue('second-new');
    });

    it('被包装组件发出的 change 使用当前的空值配置', async () => {
        const { api, rerender } = renderField({ allowEmptyString: false, emittedValue: 'first', emptyValue: 'old-empty' });
        await rerender({ allowEmptyString: false, emittedValue: 'new-empty', emptyValue: 'new-empty' });
        expect(api().getValue('name')).toBeUndefined();
        await rerender({ allowEmptyString: true, emittedValue: 'last-empty', emptyValue: 'last-empty' });
        expect(api().getValue('name')).toBe('last-empty');
    });

    it('批量校验逐字段显示错误，整表订阅等全部校验结束才更新', async () => {
        const fast = Promise.withResolvers<string>();
        const slow = Promise.withResolvers<string>();
        const onChange = vi.fn<(formState: FormState) => void>();
        const { api } = renderForm({ onChange }, [
            { type: 'field', props: { component: ProbeControl, field: 'fast', validator: () => fast.promise } },
            { type: 'field', props: { component: ProbeControl, field: 'slow', validator: () => slow.promise } },
            { type: 'stateProbe', props: { field: 'fast' } },
        ]);
        const validation = api()
            .validate()
            .catch((errors: unknown) => errors);
        fast.resolve('fast-error');
        await fast.promise;
        flushSync();
        expect(screen.getByText('fast-error')).toBeInTheDocument();
        expect(screen.queryByText('slow-error')).toBeNull();
        expect(api().getError('fast')).toBe('fast-error');
        expect(screen.getByTestId('form-state')).toHaveTextContent('{"values":{},"errors":{},"touched":{}}');
        expect(screen.getByTestId('field-state')).toHaveTextContent('{}');
        expect(onChange).not.toHaveBeenCalled();
        slow.resolve('slow-error');
        await validation;
        await settle();
        expect(screen.getByText('slow-error')).toBeInTheDocument();
        expect(JSON.parse(screen.getByTestId('form-state').textContent ?? '')).toEqual({
            values: {},
            errors: { fast: 'fast-error', slow: 'slow-error' },
            touched: { fast: true, slow: true },
        });
        expect(JSON.parse(screen.getByTestId('field-state').textContent ?? '')).toEqual({ error: 'fast-error', touched: true });
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it.each(['field-init', ''])('首轮控件收到字段 initValue %j，注册不改写控件值', (initValue) => {
        const firstValues: unknown[] = [];
        const { api } = renderForm({ initValues: { name: 'form-init' } }, [{ type: 'field', props: { component: InitialControl, field: 'name', initValue, onCreate: (value: unknown) => firstValues.push(value) } }]);
        expect(firstValues).toEqual([initValue]);
        expect(textbox()).toHaveAttribute('data-value', JSON.stringify(initValue));
        expect(api().getValue('name')).toBe(initValue === '' ? undefined : initValue);
    });

    it('status 随错误、规则成功和 reset 流转，但不进入公开状态', async () => {
        const { api } = renderForm({}, [
            { type: 'field', props: { component: ProbeControl, field: 'name', rules: [{ required: true, message: 'required' }] } },
            { type: 'stateProbe', props: {} },
        ]);
        const input = textbox();
        expect(input).not.toHaveAttribute('data-status');
        api().setError('name', 'bad');
        await settle();
        expect(input).toHaveAttribute('data-status', 'error');
        api().setError('name', undefined);
        await settle();
        expect(input).toHaveAttribute('data-status', 'success');
        api().reset();
        await settle();
        expect(input).toHaveAttribute('data-status', 'default');
        api().setValue('name', 'ok');
        await api().validate();
        await settle();
        expect(input).toHaveAttribute('data-status', 'success');
        expect(api().getFormState()).toEqual({ values: { name: 'ok' }, errors: {}, touched: { name: true } });
        expect(JSON.parse(screen.getByTestId('field-state').textContent ?? '')).toEqual({ value: 'ok', touched: true });
        await api().validate({ silent: true });
        await settle();
        expect(input).toHaveAttribute('data-status', 'success');
    });

    it('validateStatus 只覆盖控件展示，不写入公开状态', async () => {
        const { api } = renderForm({}, [{ type: 'field', props: { component: ProbeControl, field: 'name', validateStatus: 'warning' } }]);
        api().setError('name', 'bad');
        await settle();
        expect(textbox()).toHaveAttribute('data-status', 'warning');
        expect(api().getFormState()).toEqual({ values: {}, errors: { name: 'bad' }, touched: {} });
    });

    it('reset 使用最近一次注册时的 initValue，普通属性更新不替换初值，null 重置为 undefined', async () => {
        const onValueChange = vi.fn<(...args: unknown[]) => void>();
        const onReset = vi.fn<() => void>();
        const { api, rerender } = renderField({ field: 'before', initValue: 'first' }, { onReset, onValueChange }, ProbeControl);
        await rerender({ field: 'before', initValue: 'ignored' });
        api().reset();
        await settle();
        expect(textbox()).toHaveValue('first');
        await rerender({ field: 'after', initValue: 'renamed' });
        api().reset();
        await settle();
        expect(textbox()).toHaveValue('renamed');
        await rerender({ field: 'null-value', initValue: null });
        api().reset();
        await settle();
        expect(textbox()).not.toHaveAttribute('data-value');
        expect(textbox()).toHaveAttribute('data-status', 'default');
        expect(api().getFormState()).toEqual({ values: {}, errors: {}, touched: {} });
        expect(onValueChange).not.toHaveBeenCalled();
        expect(onReset).toHaveBeenCalledTimes(3);
    });

    it('尚未 touched 的字段改名后，blur 只写入新字段路径', async () => {
        const { api, rerender } = renderField({ field: 'before' }, {}, ProbeControl);
        await rerender({ field: 'after' });
        await fireEvent.blur(textbox());
        expect(api().getFormState()).toEqual({ values: {}, errors: {}, touched: { after: true } });
    });

    it('字段改名携带值、错误和控件 status，已有 touched 不在新路径重新写入', async () => {
        const { api, rerender } = renderField({ field: 'before', initValue: 'init' }, {}, ProbeControl);
        api().setValue('before', 'changed');
        api().setError('before', 'carried-error');
        api().setTouched('before', true);
        await rerender({ field: 'after', initValue: 'init' });
        const input = textbox();
        expect(input).toHaveValue('changed');
        expect(input).toHaveAttribute('data-status', 'error');
        expect(api().getFormState()).toEqual({ values: { after: 'changed' }, errors: { after: 'carried-error' }, touched: {} });
        await fireEvent.blur(input);
        expect(api().getTouched('after')).toBeUndefined();
    });

    it('ArrayField 删除前行后，后行携带值、错误和控件 status，blur 不重写 touched', async () => {
        const { api } = renderForm({ initValues: { rows: [{ name: 'first' }, { name: 'second' }] } }, [{ type: 'arrayRows', props: { field: 'rows', probe: true } }]);
        api().setValue('rows[1].name', 'changed');
        api().setError('rows[1].name', 'row-error');
        api().setTouched('rows[1].name', true);
        await settle();
        await fireEvent.click(screen.getByRole('button', { name: '删除首行' }));
        await settle();
        const input = textbox();
        expect(input).toHaveValue('changed');
        expect(input).toHaveAttribute('data-status', 'error');
        expect(api().getValue('rows')).toEqual([{ name: 'changed' }]);
        expect(api().getError('rows[0].name')).toBe('row-error');
        expect(api().getTouched('rows[0].name')).toBeUndefined();
        await fireEvent.blur(input);
        expect(api().getTouched('rows[0].name')).toBeUndefined();
    });

    it('嵌套 setValue 后控件只以新值渲染一次', async () => {
        const { values, props } = countedField();
        const { api } = renderForm({ initValues: { person: { name: 'before' } } }, [{ type: 'field', props: { ...props, field: 'person.name' } }]);
        api().setValue('person', { name: 'after' });
        await settle();
        expect(values).toEqual(['after']);
        expect(textbox()).toHaveValue('after');
    });

    it('无关字段更新不重新渲染包装控件，自身字段更新渲染一次', async () => {
        const { values, props } = countedField();
        const { api } = renderForm({}, [
            { type: 'field', props: { ...props, field: 'name', initValue: 'init' } },
            { type: 'field', props: { component: ProbeControl, field: 'other' } },
        ]);
        api().setValue('other', 'other-value');
        await settle();
        expect(values).toHaveLength(0);
        api().setValue('name', 'next');
        await settle();
        expect(values).toEqual(['next']);
    });
});
