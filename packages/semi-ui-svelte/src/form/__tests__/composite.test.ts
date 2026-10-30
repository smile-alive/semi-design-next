import { flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import type { FormApi } from '../interface';
import CompositeFixture from './composite-fixture.svelte';
import { errorSelector, prefix, settle, typeInto } from './helpers';

function renderComposite(kind: 'array' | 'arrayFromForm' | 'group' | 'hooks' | 'layout' | 'useForm', initValues?: Record<string, unknown>) {
    let formApi: FormApi | undefined;
    const view = render(CompositeFixture, { props: { kind, initValues, onApi: (api: FormApi) => (formApi = api) } });
    return { ...view, api: () => formApi as FormApi };
}

const rowValues = () => screen.getAllByRole('textbox', { name: '名字' }).map((item) => (item as HTMLInputElement).value);

describe('Svelte Form ArrayField', () => {
    it('按 initValue 渲染行，行内字段读到各自的值', () => {
        const { api } = renderComposite('array');
        expect(rowValues()).toEqual(['a', 'b']);
        expect(api().getValue('rules')).toEqual([{ name: 'a' }, { name: 'b' }]);
    });

    it('onAdd 追加空行，onRemove 删除对应行', async () => {
        const { api } = renderComposite('array');
        await fireEvent.click(screen.getByRole('button', { name: '新增' }));
        await settle();
        expect(screen.getAllByTestId('row')).toHaveLength(3);
        await fireEvent.click(screen.getAllByRole('button', { name: '删除' })[0]);
        await settle();
        expect(rowValues()).toEqual(['b', '']);
        expect(api().getValue('rules')[0]).toEqual({ name: 'b' });
    });

    it('onAddWithInitValue 在指定位置插入带值的行', async () => {
        const { api } = renderComposite('array');
        await fireEvent.click(screen.getByRole('button', { name: '头部插入' }));
        await settle();
        expect(rowValues()).toEqual(['top', 'a', 'b']);
        expect(api().getValue('rules')).toEqual([{ name: 'top' }, { name: 'a' }, { name: 'b' }]);
    });

    it('setValue 改写行数与行值，reset 恢复 initValue', async () => {
        const { api } = renderComposite('array');
        api().setValue('rules', [{ name: 'x' }]);
        await settle();
        expect(rowValues()).toEqual(['x']);
        await typeInto(screen.getByRole('textbox', { name: '名字' }) as HTMLInputElement, 'y');
        expect(api().getValue('rules')).toEqual([{ name: 'y' }]);
        api().reset();
        await settle();
        expect(rowValues()).toEqual(['a', 'b']);
    });

    it('ArrayField 的 initValue 优先于 Form 的 initValues', () => {
        renderComposite('array', { rules: [{ name: 'f' }] });
        expect(rowValues()).toEqual(['a', 'b']);
    });

    it('ArrayField 没有 initValue 时从 Form 的 initValues 取行值', () => {
        const { api } = renderComposite('arrayFromForm', { rules: [{ name: 'f' }, { name: 'g' }] });
        expect(rowValues()).toEqual(['f', 'g']);
        expect(api().getValue('rules')).toEqual([{ name: 'f' }, { name: 'g' }]);
    });
});

describe('Svelte Form 组合组件', () => {
    it('FormInputGroup 用组标签命名控件，组内字段的错误汇总显示并关联到控件', async () => {
        const { api, container } = renderComposite('group');
        expect(screen.getAllByRole('group')).toHaveLength(1);
        const group = screen.getByRole('group', { name: '地址' });
        expect(group).toHaveClass('semi-input-group');
        expect(screen.getAllByRole('textbox', { name: '地址' })).toHaveLength(2);
        const city = container.querySelectorAll('input')[0];
        expect(city.getAttribute('aria-labelledby')).toContain(group.getAttribute('aria-labelledby'));
        await api()
            .validate()
            .catch(() => undefined);
        await settle();
        const error = container.querySelector(errorSelector) as HTMLElement;
        expect(error).toHaveTextContent('城市必填');
        expect(city).toHaveAttribute('aria-invalid', 'true');
        expect(city.getAttribute('aria-errormessage') ?? city.getAttribute('aria-describedby')).toContain(error.id);
    });

    it('FormSection 渲染标题，FormSlot 用标签命名分组并显示错误', () => {
        const { container } = renderComposite('layout');
        expect(container.querySelector(`section.${prefix}-section h5`)).toHaveTextContent('基本信息');
        expect(screen.getByRole('group', { name: '说明' })).toHaveTextContent('只读内容');
        expect(container.querySelector(errorSelector)).toHaveTextContent('说明有误');
    });
});

describe('Svelte Form hooks', () => {
    it('useFormState 与 useFieldState 跟随表单，useFieldApi 与 useFormApi 写入表单', async () => {
        renderComposite('hooks');
        const read = () => JSON.parse(screen.getByTestId('hooks').textContent ?? '');
        await typeInto(screen.getByRole('textbox', { name: '名称' }) as HTMLInputElement, 'typed');
        expect(read()).toEqual({ values: { name: 'typed' }, field: { value: 'typed', touched: true } });
        await fireEvent.click(screen.getByRole('button', { name: '字段写入' }));
        await settle();
        expect(screen.getByRole('textbox', { name: '名称' })).toHaveValue('hooked');
        await fireEvent.click(screen.getByRole('button', { name: '字段报错' }));
        await settle();
        expect(read().field.error).toBe('出错');
        await fireEvent.click(screen.getByRole('button', { name: '表单写入' }));
        await settle();
        expect(read().field.value).toBe('form');
    });
});

describe('Svelte Form useForm', () => {
    it('useForm 的 values 跟随表单，formApi 在 Form 外写值同步到字段', async () => {
        renderComposite('useForm');
        await settle();
        expect(JSON.parse(screen.getByTestId('external').textContent ?? '')).toEqual({ name: 'init' });
        await typeInto(screen.getByRole('textbox', { name: '名称' }) as HTMLInputElement, 'typed');
        expect(JSON.parse(screen.getByTestId('external').textContent ?? '')).toEqual({ name: 'typed' });
        await fireEvent.click(screen.getByRole('button', { name: '外部写入' }));
        await settle();
        flushSync();
        expect(screen.getByRole('textbox', { name: '名称' })).toHaveValue('outside');
    });
});
