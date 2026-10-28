/** @jsxImportSource vue */
import { createCommentVNode, defineComponent, nextTick, ref } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor, within } from '@testing-library/vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render, sleep } from '@test/utils/vue';
import ScrollList, { ScrollItem, type ScrollItemHandle, type ScrollItemSelectData, type ScrollListItem } from '..';
import semiGlobal from '../../_utils/semi-global';
import Demo from './fixtures/demo.vue';
import TwoWay from './fixtures/two-way.vue';

type SelectHandler = (data: ScrollItemSelectData) => void;

const prefix = `${BASE_CLASS_PREFIX}-scrolllist`;
const DEFAULT_INDEX = 1;
const minutes = Array.from({ length: 60 }, (_, index) => ({ value: index, disabled: index % 2 === 1 }));
const numbers = (length: number) => Array.from({ length }, (_, index) => ({ value: index }));

const getItemTexts = (list: Element) =>
    within(list as HTMLElement)
        .getAllByRole('option')
        .map((option) => option.textContent);

// jsdom has no layout: items sit 36px apart in their list and every other element is 180px tall
const mockItemLayout = () => {
    vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (this: HTMLElement) {
        return this.tagName === 'LI' ? Array.prototype.indexOf.call(this.parentNode?.children, this) * 36 : 0;
    });
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
        return this.tagName === 'LI' ? 36 : 180;
    });
};

const mockRects = () =>
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
        const height = this.tagName === 'LI' ? 36 : 100;
        return { top: 0, bottom: height, left: 0, right: 0, width: 0, height, x: 0, y: 0, toJSON: () => ({}) };
    });

function renderItem(props: Record<string, unknown>, attrs: Record<string, unknown> = {}) {
    return render(ScrollItem, { props, attrs });
}

function renderWithRef(props: Record<string, unknown>) {
    const handle = ref<ScrollItemHandle | null>(null);
    const view = render(defineComponent(() => () => <ScrollItem {...props} ref={handle} />));
    return { ...view, handle };
}

describe('ScrollList', () => {
    beforeEach(() => {
        // ScrollItem debounces selection and animates scrolling with Date-based timers, which need a running clock
        vi.useRealTimers();
    });

    it('wheel 模式外观', async () => {
        const onAmpmSelect = vi.fn<SelectHandler>();
        const onHourSelect = vi.fn<SelectHandler>();
        const onMinuteSelect = vi.fn<SelectHandler>();
        const view = render(Demo, { props: { onAmpmSelect, onHourSelect, onMinuteSelect } });

        const all = view.container.querySelectorAll<HTMLElement>(`.${prefix}-list-outer`);
        expect(all).toHaveLength(3);
        expect(screen.getByText('滚动列表')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Ok' })).toBeInTheDocument();

        const [ampmList, hourList, minuteList] = all;
        const minuteItems = within(minuteList).getAllByRole('option');
        const firstDisabled = minutes.findIndex((minute) => minute.disabled);
        const nextEnabled = minutes.findIndex((minute, index) => index > 1 && !minute.disabled);

        expect(minuteItems[firstDisabled]).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(minuteItems[firstDisabled]);
        await sleep(100);
        expect(onMinuteSelect).not.toHaveBeenCalled();

        await userEvent.click(minuteItems[nextEnabled]);
        await waitFor(() => expect(onMinuteSelect).toHaveBeenCalledTimes(1));
        expect(onMinuteSelect).toHaveBeenLastCalledWith(expect.objectContaining({ value: nextEnabled, type: 3, index: nextEnabled }));

        await fireEvent.scroll(minuteList);
        await waitFor(() => expect(onMinuteSelect).toHaveBeenCalledTimes(2));
        expect(onMinuteSelect).toHaveBeenLastCalledWith(expect.objectContaining({ value: 0, index: 0 }));

        expect(getItemTexts(ampmList)).toEqual(['AM', '下午']);
        await view.rerender({ selectedAmpmIndex: 0 });
        expect(getItemTexts(ampmList)).toEqual(['上午', 'PM']);
        await userEvent.click(within(ampmList).getByText('PM'));
        await waitFor(() => expect(onAmpmSelect).toHaveBeenCalled());
        expect(onAmpmSelect).toHaveBeenLastCalledWith(expect.objectContaining({ value: 'PM', type: 1, index: 1 }));

        await fireEvent.scroll(hourList);
        await waitFor(() => expect(onHourSelect).toHaveBeenCalled());
        expect(onHourSelect).toHaveBeenLastCalledWith(expect.objectContaining({ value: 1, type: 2, index: 0 }));
    });

    it('normal 模式外观', async () => {
        const onAmpmSelect = vi.fn<SelectHandler>();
        const onMinuteSelect = vi.fn<SelectHandler>();
        const view = render(Demo, { props: { mode: 'normal', onAmpmSelect, onMinuteSelect } });

        const all = view.container.querySelectorAll<HTMLElement>(`.${prefix}-item`);
        expect(all).toHaveLength(3);
        const [ampmList, , minuteList] = all;

        const nextEnabled = minutes.findIndex((minute, index) => index > DEFAULT_INDEX && !minute.disabled);
        const minuteItems = within(minuteList).getAllByRole('option');
        await userEvent.click(minuteItems[nextEnabled]);
        expect(onMinuteSelect).toHaveBeenCalledTimes(1);
        expect(onMinuteSelect).toHaveBeenCalledWith(expect.objectContaining({ value: nextEnabled, type: 3, index: nextEnabled }));

        await userEvent.click(minuteItems[DEFAULT_INDEX]);
        expect(onMinuteSelect).toHaveBeenCalledTimes(1);

        const selectedAmpmIndex = () =>
            within(ampmList)
                .getAllByRole('option')
                .findIndex((el) => el.classList.contains(`${prefix}-item-sel`));
        expect(selectedAmpmIndex()).toBe(DEFAULT_INDEX);
        await view.rerender({ selectedAmpmIndex: 0 });
        expect(selectedAmpmIndex()).toBe(0);
        expect(getItemTexts(ampmList)).toEqual(['上午', 'PM']);
    });
});

describe('ScrollList 行为', () => {
    beforeEach(() => {
        vi.useRealTimers();
    });
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('header、footer 插槽带固定的 x-semi-prop，数字 bodyHeight 按 px 处理', () => {
        const view = render(ScrollList, {
            props: { bodyHeight: 200 },
            slots: { default: () => <span>child</span>, header: () => 'title', footer: () => 'foot' },
        });
        const root = view.container.firstElementChild;
        expect(root).toHaveClass(prefix);
        expect(screen.getByText('title')).toHaveAttribute('x-semi-prop', 'header');
        expect(screen.getByText('title')).toHaveClass(`${prefix}-header-title`);
        expect(screen.getByText('foot')).toHaveAttribute('x-semi-prop', 'footer');
        expect(screen.getByText('foot')).toHaveClass(`${prefix}-footer`);
        expect(view.container.querySelector(`.${prefix}-line`)).toBeInTheDocument();
        const body = screen.getByText('child').parentElement;
        expect(body).toHaveClass(`${prefix}-body`);
        expect(body).toHaveAttribute('x-semi-prop', 'children');
        expect(body).toHaveStyle({ height: '200px' });
    });

    it('header、footer 也可用字符串属性传入，插槽优先', () => {
        const view = render(ScrollList, {
            props: { header: 'prop title', footer: 'prop foot' },
            slots: { header: () => 'slot title' },
        });
        expect(view.container.querySelector(`.${prefix}-header-title`)).toHaveTextContent(/^slot title$/);
        expect(view.container.querySelector(`.${prefix}-footer`)).toHaveTextContent(/^prop foot$/);
    });

    it('未传入时不渲染头部与底部', () => {
        const view = render(ScrollList, { slots: { default: () => 'child' } });
        expect(view.container.querySelector(`.${prefix}-header`)).toBeNull();
        expect(view.container.querySelector(`.${prefix}-footer`)).toBeNull();
    });

    it('插槽内容为空时不渲染头部与底部，即使传了同名字符串属性', () => {
        const view = render(ScrollList, {
            props: { header: 'title' },
            slots: { header: () => [createCommentVNode('v-if')], footer: () => [] },
        });
        expect(view.container.querySelector(`.${prefix}-header`)).toBeNull();
        expect(view.container.querySelector(`.${prefix}-footer`)).toBeNull();
    });

    it('data-* 属性、class 与 style 透传到根元素', () => {
        const view = render(ScrollList, {
            attrs: { class: 'custom', style: { color: 'red' }, 'data-testid': 'list' },
            slots: { default: () => 'child' },
        });
        const root = screen.getByTestId('list');
        expect(root).toBe(view.container.firstElementChild);
        expect(root).toHaveClass('custom', prefix);
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('自定义 class 只作用于根元素', () => {
        const view = render(ScrollList, {
            attrs: { class: 'custom' },
            slots: { default: () => 'child', header: () => 'title', footer: () => 'foot' },
        });
        expect(view.container.querySelectorAll('.custom')).toHaveLength(1);
    });

    it('组件 ref 的 $el 指向根元素', () => {
        const list = ref<{ $el: Element } | null>(null);
        const view = render(defineComponent(() => () => <ScrollList ref={list}>{() => 'child'}</ScrollList>));
        expect(list.value?.$el).toBe(view.container.firstElementChild);
    });

    it('读取 semiGlobal overrideDefaultProps 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { ScrollList: { bodyHeight: 120 }, ScrollItem: { mode: 'normal' } };
        const view = render(ScrollList, { slots: { default: () => <ScrollItem list={numbers(3)} /> } });
        expect(view.container.querySelector(`.${prefix}-body`)).toHaveStyle({ height: '120px' });
        expect(view.container.querySelector(`.${prefix}-item`)).toBeInTheDocument();
        expect(view.container.querySelector(`.${prefix}-item-wheel`)).toBeNull();
    });

    it('字符串 bodyHeight 原样使用，0 不设高度', async () => {
        const view = render(ScrollList, { props: { bodyHeight: '50%' }, slots: { default: () => 'child' } });
        const body = view.container.querySelector<HTMLElement>(`.${prefix}-body`);
        expect(body?.style.height).toBe('50%');
        await view.rerender({ bodyHeight: 0 });
        expect(body?.style.height).toBe('');
    });

    it('被命名时根元素为 group，使用方的 role 优先', async () => {
        const view = render(ScrollList, { attrs: { 'aria-label': 'time' }, slots: { default: () => 'child' } });
        expect(screen.getByRole('group', { name: 'time' })).toBe(view.container.firstElementChild);
        view.unmount();
        const own = render(ScrollList, {
            attrs: { 'aria-label': 'time', role: 'region' },
            slots: { default: () => 'child' },
        });
        expect(own.container.firstElementChild).toHaveAttribute('role', 'region');
    });

    it('ScrollList.Item 即 ScrollItem', () => {
        expect(ScrollList.Item).toBe(ScrollItem);
    });
});

describe('ScrollItem 行为', () => {
    beforeEach(() => {
        vi.useRealTimers();
    });
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('normal 模式渲染 items、选中类名、转换后的文本与禁用项', async () => {
        const list = [{ value: 'a' }, { value: 'b', transform: (v: string) => `item-${v}` }, { value: 'c', disabled: true }];
        const transform = (v: string) => `common-${v}`;
        const view = renderItem({ list, mode: 'normal', selectedIndex: 0, transform }, { class: 'col', style: { color: 'red' }, 'aria-label': 'letters' });
        const root = view.container.firstElementChild as Element;
        expect(root).toHaveClass(`${prefix}-item`, 'col');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(screen.getByRole('listbox', { name: 'letters' })).toBeInTheDocument();
        expect(getItemTexts(root)).toEqual(['common-a', 'b', 'c']);
        const options = screen.getAllByRole('option');
        expect(options[0]).toHaveClass(`${prefix}-item-sel`);
        expect(options[2]).toHaveClass(`${prefix}-item-disabled`);
        expect(options[2]).toHaveAttribute('aria-disabled', 'true');

        await view.rerender({ selectedIndex: 1 });
        expect(getItemTexts(root)).toEqual(['a', 'item-b', 'c']);
        expect(screen.getAllByRole('option')[1]).toHaveClass(`${prefix}-item-sel`);
    });

    it('normal 模式点击发出 select，载荷含 item、type 与 index；跳过禁用项', async () => {
        const onSelect = vi.fn<SelectHandler>();
        const list = [
            { value: 'a', extra: 1 },
            { value: 'b', disabled: true },
            { value: 'c', text: 'C' },
        ];
        renderItem({ type: 'letter', list, mode: 'normal', onSelect });
        const options = screen.getAllByRole('option');

        await userEvent.click(options[1]);
        expect(onSelect).not.toHaveBeenCalled();

        await userEvent.click(options[2]);
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith({ value: 'c', text: 'C', type: 'letter', index: 2 });

        await userEvent.click(options[0]);
        expect(onSelect).toHaveBeenLastCalledWith({ value: 'a', extra: 1, type: 'letter', index: 0 });
    });

    it('wheel 模式渲染遮罩、选择器与非循环的外层列表', () => {
        const view = renderItem({ list: numbers(3), selectedIndex: 1 });
        const root = view.container.firstElementChild as Element;
        expect(root).toHaveClass(`${prefix}-item-wheel`);
        expect(root.querySelector(`.${prefix}-shade-pre`)).toBeInTheDocument();
        expect(root.querySelector(`.${prefix}-shade-post`)).toBeInTheDocument();
        expect(root.querySelector(`.${prefix}-selector`)).toBeInTheDocument();
        expect(root.querySelector(`.${prefix}-list-outer-nocycle > ul`)).toBeInTheDocument();
        expect(root.querySelector(`.${prefix}-item-sel`)).toBeNull();
    });

    it('wheel 模式点击在防抖后选中，并传入 item、type 与 index', async () => {
        const onSelect = vi.fn<SelectHandler>();
        renderItem({ type: 'n', list: numbers(5), onSelect });
        await userEvent.click(screen.getAllByRole('option')[3]);
        expect(onSelect).not.toHaveBeenCalled();
        await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
        expect(onSelect).toHaveBeenCalledWith({ value: 3, type: 'n', index: 3 });
    });

    it('循环 wheel 模式在需要副本填满视图时将列表渲染三次，副本对辅助技术隐藏', async () => {
        mockRects();
        const list = numbers(12);
        const view = renderItem({ cycled: true, list, selectedIndex: 2 });
        await nextTick();
        expect(view.container.querySelector(`.${prefix}-list-outer-nocycle`)).toBeNull();
        const all = [...view.container.querySelectorAll('li')];
        expect(all).toHaveLength(36);
        expect(all.slice(12, 24).map((li) => li.textContent)).toEqual(list.map(({ value }) => String(value)));
        expect(getItemTexts(view.container)).toEqual(list.map(({ value }) => String(value)));
        expect(screen.getAllByRole('option', { selected: true })).toHaveLength(1);
        expect(all.filter((li) => li.getAttribute('aria-hidden') === 'true')).toHaveLength(24);
        expect(all.filter((li) => li.id)).toHaveLength(12);
    });

    it('挂载时以及 selectedIndex 变化后，把选中项滚动到中间', async () => {
        mockItemLayout();
        const view = renderItem({ list: numbers(10), mode: 'normal', motion: false, selectedIndex: 0 });
        const wrapper = view.container.firstElementChild as Element;
        // the first item has offsetTop 0, which the scroll target treats as unknown and falls back to the list middle
        expect(wrapper.scrollTop).toBe(108);

        await view.rerender({ selectedIndex: 4 });
        expect(wrapper.scrollTop).toBe(72);
    });

    it('挂载时列表为空、数据到达后，将选中项居中', async () => {
        mockItemLayout();
        const view = renderItem({ list: [], mode: 'wheel', motion: false, selectedIndex: 0 });
        const wrapper = view.container.querySelector(`.${prefix}-list-outer`) as Element;
        await view.rerender({ list: numbers(10), selectedIndex: 4 });
        expect(wrapper.scrollTop).toBe(72);
        await view.rerender({ selectedIndex: 6 });
        expect(wrapper.scrollTop).toBe(144);
        await view.rerender({ list: [] });
        await view.rerender({ list: numbers(10) });
        expect(wrapper.scrollTop).toBe(144);
    });

    it('normal 模式的循环列表挂载时为空、数据到达后，将选中项居中', async () => {
        mockItemLayout();
        const view = renderItem({ cycled: true, list: [], mode: 'normal', motion: false, selectedIndex: 4 });
        await view.rerender({ list: numbers(10) });
        expect(view.container.firstElementChild?.scrollTop).toBe(72);
    });

    it('循环列表中父组件修改 selectedIndex，从当前所在副本按偏移取目标项并居中', async () => {
        mockItemLayout();
        mockRects();
        const view = renderItem({ cycled: true, list: numbers(12), motion: false, selectedIndex: 2 });
        await nextTick();
        const wrapper = view.container.querySelector(`.${prefix}-list-outer`) as Element;
        expect(wrapper.scrollTop).toBe(432);

        await view.rerender({ selectedIndex: 5 });
        expect(wrapper.scrollTop).toBe(17 * 36 - 72);
        await view.rerender({ selectedIndex: 0 });
        expect(wrapper.scrollTop).toBe(12 * 36 - 72);
    });

    it('motion 开启时，selectedIndex 变化后滚动带动画', async () => {
        mockItemLayout();
        const view = renderItem({ list: numbers(10), mode: 'normal', selectedIndex: 0 });
        const wrapper = view.container.firstElementChild as Element;
        await view.rerender({ selectedIndex: 4 });
        await waitFor(() => expect(wrapper.scrollTop).toBe(72));
    });

    it('组件 ref 的 scrollToIndex() 滚动回选中项', () => {
        mockItemLayout();
        const view = renderWithRef({ list: numbers(10), mode: 'normal', motion: false, selectedIndex: 4 });
        const wrapper = view.container.firstElementChild as Element;
        expect(wrapper.scrollTop).toBe(72);
        wrapper.scrollTop = 0;
        view.handle.value?.scrollToIndex();
        expect(wrapper.scrollTop).toBe(72);
    });

    it('组件 ref 只暴露 scrollToIndex', () => {
        const view = renderWithRef({ list: numbers(3) });
        expect(Object.keys(view.handle.value ?? {})).toEqual(['scrollToIndex']);
    });

    it('卸载后不发出 select（循环模式）', async () => {
        const onSelect = vi.fn<SelectHandler>();
        const view = renderItem({ cycled: true, list: numbers(5), onSelect });
        await userEvent.click(screen.getAllByRole('option')[3]);
        view.unmount();
        await sleep(100);
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('卸载后不发出 select（非循环模式）', async () => {
        const onSelect = vi.fn<SelectHandler>();
        const view = renderItem({ list: numbers(5), onSelect });
        await userEvent.click(screen.getAllByRole('option')[3]);
        view.unmount();
        await sleep(100);
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('卸载时停止滚动动画', async () => {
        mockItemLayout();
        const setScrollTop = vi.spyOn(Element.prototype, 'scrollTop', 'set');
        const view = renderItem({ list: numbers(10), mode: 'normal', selectedIndex: 0 });
        await view.rerender({ selectedIndex: 4 });
        view.unmount();
        const calls = setScrollTop.mock.calls.length;
        await sleep(200);
        expect(setScrollTop).toHaveBeenCalledTimes(calls);
    });

    it('wheel 模式每次点击只发出一次 select', async () => {
        const onSelect = vi.fn<SelectHandler>();
        renderItem({ list: numbers(5), onSelect });
        await userEvent.click(screen.getAllByRole('option')[2]);
        await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
        await sleep(100);
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith({ value: 2, type: undefined, index: 2 });
    });

    it('两种模式下都能渲染空列表', () => {
        expect(() => renderItem({ list: [] })).not.toThrow();
        expect(() => renderItem({ mode: 'normal' })).not.toThrow();
    });

    it('data-* 属性透传到根元素', () => {
        const view = renderItem({ list: numbers(3) }, { 'data-testid': 'col' });
        expect(screen.getByTestId('col')).toBe(view.container.firstElementChild);
    });

    it('aria-labelledby 与 aria-describedby 落在 listbox 上，而不是没有角色的根元素', () => {
        const view = render(
            defineComponent(() => () => (
                <>
                    <span id="hours-title">小时</span>
                    <span id="hours-hint">选择小时</span>
                    <ScrollItem aria-describedby="hours-hint" aria-labelledby="hours-title" list={numbers(3)} />
                </>
            ))
        );
        const listbox = screen.getByRole('listbox', { name: '小时', description: '选择小时' });
        expect(listbox.tagName).toBe('UL');
        expect(view.container.querySelector('div[aria-labelledby], div[aria-describedby]')).toBeNull();
    });

    it('attrs 分流：命名属性落在 listbox，其余落在根元素', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const view = renderItem({ list: numbers(3), mode: 'normal' }, { 'aria-label': 'n', class: 'col', style: { color: 'red' }, id: 'col', 'data-x': 'y', onClick });
        const root = view.container.firstElementChild as HTMLElement;
        expect(screen.getByRole('listbox')).toHaveAttribute('aria-label', 'n');
        expect(root).toHaveClass('col');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(root).toHaveAttribute('id', 'col');
        expect(root).toHaveAttribute('data-x', 'y');
        expect(root).not.toHaveAttribute('aria-label');
        await userEvent.click(screen.getAllByRole('option')[1]);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('normal 模式没有外层列表包装，ul 不带外层类名', () => {
        const view = renderItem({ list: numbers(3), mode: 'normal' });
        expect(view.container.querySelector(`.${prefix}-list-outer`)).toBeNull();
        const listbox = screen.getByRole('listbox');
        expect(listbox.parentElement).toBe(view.container.firstElementChild);
        expect(listbox.className).toBe('');
    });

    it('wheel 模式点击列表不冒泡到祖先元素的 click 监听', async () => {
        const onSelect = vi.fn<SelectHandler>();
        const ancestorClick = vi.fn<() => void>();
        const view = renderItem({ list: numbers(5), onSelect });
        view.container.addEventListener('click', ancestorClick);
        await userEvent.click(screen.getAllByRole('option')[2]);
        await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
        expect(ancestorClick).not.toHaveBeenCalled();
    });

    it('用 aria-selected 标记选中的选项', () => {
        renderItem({ list: numbers(3), mode: 'normal', selectedIndex: 1 });
        expect(screen.getAllByRole('option').map((option) => option.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false']);
    });

    it.each(['normal', 'wheel'])('%s 模式：listbox 获得焦点，并把 active descendant 指向选中的选项', async (mode) => {
        renderItem({ list: numbers(3), mode, selectedIndex: 1 }, { 'aria-label': 'hour' });
        const listbox = screen.getByRole('listbox', { name: 'hour' });
        await userEvent.tab();
        expect(listbox).toHaveFocus();
        const active = document.getElementById(listbox.getAttribute('aria-activedescendant') ?? '');
        expect(active).toHaveTextContent(/^1$/);
        expect(active).toHaveAttribute('aria-selected', 'true');
    });

    it('方向键、Home、End 与输入字符通过 select 选中，跳过禁用项', async () => {
        const onSelect = vi.fn<SelectHandler>();
        const list = [{ value: 'apple' }, { value: 'banana', disabled: true }, { value: 'cherry' }, { value: 'cocoa' }];
        const view = renderItem({ type: 'fruit', list, mode: 'normal', selectedIndex: 0, onSelect });
        screen.getByRole('listbox').focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(onSelect).toHaveBeenLastCalledWith({ value: 'cherry', type: 'fruit', index: 2 });

        await view.rerender({ selectedIndex: 2 });
        await userEvent.keyboard('{End}');
        expect(onSelect).toHaveBeenLastCalledWith({ value: 'cocoa', type: 'fruit', index: 3 });
        await userEvent.keyboard('{Home}');
        expect(onSelect).toHaveBeenLastCalledWith({ value: 'apple', type: 'fruit', index: 0 });
        await userEvent.keyboard('co');
        expect(onSelect).toHaveBeenLastCalledWith({ value: 'cocoa', type: 'fruit', index: 3 });
        onSelect.mockClear();
        await view.rerender({ selectedIndex: 3 });
        await userEvent.keyboard('{ArrowDown}');
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('带 Ctrl 或 Meta 的字符键不触发搜索选中', async () => {
        const onSelect = vi.fn<SelectHandler>();
        const list = [{ value: 'apple' }, { value: 'cherry' }];
        renderItem({ type: 'fruit', list, mode: 'normal', selectedIndex: 0, onSelect });
        screen.getByRole('listbox').focus();
        await userEvent.keyboard('{Control>}c{/Control}{Meta>}c{/Meta}');
        expect(onSelect).not.toHaveBeenCalled();
        await userEvent.keyboard('c');
        expect(onSelect).toHaveBeenCalledWith({ value: 'cherry', type: 'fruit', index: 1 });
    });

    it('循环列表用方向键首尾相接', async () => {
        const onSelect = vi.fn<SelectHandler>();
        renderItem({ type: 'n', cycled: true, list: numbers(3), selectedIndex: 2, onSelect });
        screen.getByRole('listbox').focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(onSelect).toHaveBeenLastCalledWith({ value: 0, type: 'n', index: 0 });
    });

    it('v-model:selectedIndex 双向绑定：点击后宿主值更新，选中类随之移动', async () => {
        render(TwoWay);
        await userEvent.click(screen.getByRole('option', { name: 'c' }));
        expect(screen.getByTestId('value')).toHaveTextContent(/^2$/);
        expect(screen.getByRole('option', { name: 'c' })).toHaveClass(`${prefix}-item-sel`);
        expect(screen.getByRole('option', { name: 'a' })).not.toHaveClass(`${prefix}-item-sel`);
    });

    it('单向绑定只通知、不移动选中', async () => {
        const onSelect = vi.fn<SelectHandler>();
        renderItem({ list: numbers(3), mode: 'normal', selectedIndex: 1, onSelect });
        await userEvent.click(screen.getAllByRole('option')[2]);
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(screen.getAllByRole('option')[1]).toHaveClass(`${prefix}-item-sel`);
        expect(screen.getAllByRole('option')[2]).not.toHaveClass(`${prefix}-item-sel`);
    });

    it('update:selectedIndex 先于 select 发出', async () => {
        const order: string[] = [];
        renderItem({
            list: numbers(3),
            mode: 'normal',
            'onUpdate:selectedIndex': (index: number) => order.push(`update:${index}`),
            onSelect: (data: ScrollItemSelectData) => order.push(`select:${data.index}`),
        });
        await userEvent.click(screen.getAllByRole('option')[2]);
        expect(order).toEqual(['update:2', 'select:2']);
    });

    it('读取全局默认的 transform 函数，传入的优先', async () => {
        semiGlobal.config.overrideDefaultProps = {
            ScrollItem: { transform: (v: ScrollListItem['value']) => `g-${v}` },
        };
        const view = renderItem({ list: numbers(2), mode: 'normal', selectedIndex: 0 });
        expect(getItemTexts(view.container)).toEqual(['g-0', '1']);
        await view.rerender({ transform: (v: ScrollListItem['value']) => `own-${v}` });
        expect(getItemTexts(view.container)).toEqual(['own-0', '1']);
    });

    it('未传 selectedIndex 时选中第一项，全局默认的 selectedIndex 生效', async () => {
        const view = renderItem({ list: numbers(3), mode: 'normal' });
        expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true');
        view.unmount();
        semiGlobal.config.overrideDefaultProps = { ScrollItem: { selectedIndex: 2 } };
        renderItem({ list: numbers(3), mode: 'normal' });
        const listbox = screen.getByRole('listbox');
        expect(document.getElementById(listbox.getAttribute('aria-activedescendant') ?? '')).toHaveTextContent(/^2$/);
    });

    it('props 运行时：Boolean 类型都有 default 键，函数 prop 默认值为 undefined', () => {
        for (const component of [ScrollItem, ScrollList]) {
            const declared = (component as unknown as { props: Record<string, { type?: unknown; default?: unknown }> }).props;
            const missingDefault = Object.entries(declared)
                .filter(([, option]) => [option.type].flat().includes(Boolean) && !('default' in option))
                .map(([key]) => key);
            expect(missingDefault).toEqual([]);
        }
        const itemProps = (ScrollItem as unknown as { props: Record<string, { default?: unknown }> }).props;
        expect('default' in itemProps.transform).toBe(true);
        expect(itemProps.transform.default).toBeUndefined();
    });
});
