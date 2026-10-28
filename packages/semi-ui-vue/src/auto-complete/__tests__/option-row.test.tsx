/** @jsxImportSource vue */
import { fireEvent, screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render } from '@test/utils/vue';
import SelectOption from '../../select/option.vue';

// The row AutoComplete renders its items with; on its own it keeps Select's class names
const optionCls = `${BASE_CLASS_PREFIX}-select-option`;
type SelectHandler = (option: Record<string, unknown>, event: MouseEvent) => void;

describe('选项行（select/option.vue）', () => {
    it('empty 行渲染默认插槽的内容', () => {
        const { container } = render(SelectOption, {
            props: { empty: true },
            slots: { default: () => <span class="custom-empty">No data</span> },
        });
        expect(container.querySelector(`.${optionCls}-empty`)).not.toBeNull();
        expect(container.querySelectorAll('.custom-empty')).toHaveLength(1);
        expect(screen.queryByRole('option')).toBeNull();
    });

    it('禁用时点击不发出 select', async () => {
        const onSelect = vi.fn<SelectHandler>();
        render(SelectOption, { props: { disabled: true, value: 'test', label: 'Test', onSelect } });
        await fireEvent.click(screen.getByRole('option'));
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('点击只发出一次 select，载荷为选项记录与点击事件', async () => {
        const onSelect = vi.fn<SelectHandler>();
        render(SelectOption, { props: { value: 'test', label: 'Test Label', onSelect } });
        await fireEvent.click(screen.getByRole('option'));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect.mock.calls[0][0]).toEqual({ value: 'test', label: 'Test Label' });
        expect(onSelect.mock.calls[0][1].type).toBe('click');
    });

    it('showTick 渲染勾选图标', () => {
        const { container } = render(SelectOption, {
            props: { value: 'test', label: 'Test', selected: true, showTick: true },
        });
        expect(container.querySelectorAll(`.${optionCls}-icon`)).toHaveLength(1);
    });

    it('focused 加 focused 类名', () => {
        render(SelectOption, { props: { value: 'test', label: 'Test', focused: true } });
        expect(screen.getByRole('option')).toHaveClass(`${optionCls}-focused`);
    });

    it('selected 加 selected 类名与 aria-selected', () => {
        render(SelectOption, { props: { value: 'test', label: 'Test', selected: true } });
        const option = screen.getByRole('option');
        expect(option).toHaveClass(`${optionCls}-selected`);
        expect(option).toHaveAttribute('aria-selected', 'true');
    });

    it('current 只设 aria-selected，不加 selected 类名', () => {
        render(SelectOption, { props: { value: 'test', label: 'Test', current: true } });
        const option = screen.getByRole('option');
        expect(option).toHaveAttribute('aria-selected', 'true');
        expect(option).not.toHaveClass(`${optionCls}-selected`);
    });

    it('class 与 style 落到行元素', () => {
        render(SelectOption, {
            props: { class: 'custom-class', style: { color: 'red' }, value: 'test', label: 'Test' },
        });
        const option = screen.getByRole('option');
        expect(option).toHaveClass('custom-class');
        expect(option).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('inputValue 高亮纯文本中的匹配部分', () => {
        const { container } = render(SelectOption, {
            props: { value: 'test', inputValue: 'te' },
            slots: { default: () => 'test content' },
        });
        expect(container.querySelector(`.${optionCls}-text`)).toHaveTextContent('test content');
        const keywords = Array.from(container.querySelectorAll(`.${optionCls}-keyword`));
        expect(keywords.map((keyword) => keyword.textContent)).toEqual(['te', 'te']);
    });

    it('mouseenter 发出 mouseenter', async () => {
        const onMouseenter = vi.fn<(event: MouseEvent) => void>();
        render(SelectOption, { props: { value: 'test', label: 'Test', onMouseenter } });
        await fireEvent.mouseEnter(screen.getByRole('option'));
        expect(onMouseenter).toHaveBeenCalledTimes(1);
    });
});
