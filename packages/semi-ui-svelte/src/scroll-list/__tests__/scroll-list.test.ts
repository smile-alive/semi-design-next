import { flushSync, tick } from 'svelte';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { sleep } from '@test/utils/function';
import { ScrollItem, type ScrollItemHandle, type ScrollItemProps, type ScrollItemSelectData, type ScrollListItem } from '..';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import ScrollItemModes from './scroll-item-modes.svelte';
import ScrollListFixture from './scroll-list-fixture.svelte';

type SelectHandler = (data: ScrollItemSelectData) => void;

const prefix = `${BASE_CLASS_PREFIX}-scrolllist`;
const minutes = Array.from({ length: 60 }, (_, index) => ({ value: index, disabled: index % 2 === 1 }));
const numbers = (length: number) => Array.from({ length }, (_, index) => ({ value: index }));

const getItemTexts = (list: Element) =>
    within(list as HTMLElement)
        .getAllByRole('option')
        .map((option) => option.textContent?.trim());

// jsdom has no layout: items sit 36px apart in their list and every other element is 180px tall
function mockItemLayout() {
    vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (this: HTMLElement) {
        return this.tagName === 'LI' ? Array.prototype.indexOf.call(this.parentNode?.children, this) * 36 : 0;
    });
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
        return this.tagName === 'LI' ? 36 : 180;
    });
}

const mockRects = () =>
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
        const height = this.tagName === 'LI' ? 36 : 100;
        return { top: 0, bottom: height, left: 0, right: 0, width: 0, height, x: 0, y: 0, toJSON: () => ({}) };
    });

function renderItem(props: Partial<ScrollItemProps> = {}) {
    return render(ScrollItem, { props });
}

function setupModes(mode: 'bind' | 'function' | 'one-way' | 'uncontrolled', index?: number, accept = true) {
    const store = createStore<{ index: number | undefined; accept: boolean; log: string[] }>({ index, accept, log: [] });
    render(ScrollItemModes, { props: { mode, store } });
    const option = (name: string) => screen.getByRole('option', { name });
    const click = async (name: string) => {
        await userEvent.click(option(name));
        flushSync();
    };
    return { store, option, click };
}

describe('ScrollList', () => {
    beforeEach(() => {
        // ScrollItem debounces selection and animates scrolling with Date-based timers, which need a running clock
        vi.useRealTimers();
    });

    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('wheel 模式外观：三列、header 与 footer，点击与滚动触发 select', async () => {
        const onSelect = vi.fn<(kind: string, data: ScrollItemSelectData) => void>();
        const store = createStore({ ampm: 1, onSelect });
        const view = render(ScrollListFixture, { props: { variant: 'demo', store } });

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
        expect(onSelect).not.toHaveBeenCalled();

        await userEvent.click(minuteItems[nextEnabled]);
        await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
        expect(onSelect).toHaveBeenLastCalledWith('minute', expect.objectContaining({ value: nextEnabled, type: 3, index: nextEnabled }));

        await fireEvent.scroll(minuteList);
        await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(2));
        expect(onSelect).toHaveBeenLastCalledWith('minute', expect.objectContaining({ value: 0, index: 0 }));

        expect(getItemTexts(ampmList)).toEqual(['AM', '下午']);
        store.ampm = 0;
        flushSync();
        expect(getItemTexts(ampmList)).toEqual(['上午', 'PM']);
        await userEvent.click(within(ampmList).getByText('PM'));
        await waitFor(() => expect(onSelect).toHaveBeenCalledWith('ampm', expect.objectContaining({ value: 'PM', type: 1, index: 1 })));

        await fireEvent.scroll(hourList);
        await waitFor(() => expect(onSelect).toHaveBeenCalledWith('hour', expect.objectContaining({ value: 1, type: 2, index: 0 })));
    });

    it('normal 模式外观：点击选中，重复点击当前项不再通知', async () => {
        const onSelect = vi.fn<(kind: string, data: ScrollItemSelectData) => void>();
        const store = createStore({ ampm: 1, onSelect });
        const view = render(ScrollListFixture, { props: { variant: 'demo', mode: 'normal', store } });

        const all = view.container.querySelectorAll<HTMLElement>(`.${prefix}-item`);
        expect(all).toHaveLength(3);
        const [ampmList, , minuteList] = all;

        const nextEnabled = minutes.findIndex((minute, index) => index > 1 && !minute.disabled);
        const minuteItems = within(minuteList).getAllByRole('option');
        await userEvent.click(minuteItems[nextEnabled]);
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith('minute', expect.objectContaining({ value: nextEnabled, type: 3, index: nextEnabled }));

        await userEvent.click(minuteItems[1]);
        expect(onSelect).toHaveBeenCalledTimes(1);

        const selectedAmpmIndex = () =>
            within(ampmList)
                .getAllByRole('option')
                .findIndex((el) => el.classList.contains(`${prefix}-item-sel`));
        expect(selectedAmpmIndex()).toBe(1);
        store.ampm = 0;
        flushSync();
        expect(selectedAmpmIndex()).toBe(0);
        expect(getItemTexts(ampmList)).toEqual(['上午', 'PM']);
    });

    it('header、footer 是 snippet 时带固定的 x-semi-prop，数字 bodyHeight 按 px 处理', () => {
        const view = render(ScrollListFixture, { props: { variant: 'snippets' } });
        expect(view.container.firstElementChild).toHaveClass(prefix);
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

    it('header、footer 也可用字符串传入', () => {
        const view = render(ScrollListFixture, { props: { variant: 'strings' } });
        expect(view.container.querySelector(`.${prefix}-header-title`)).toHaveTextContent(/^prop title$/);
        expect(view.container.querySelector(`.${prefix}-footer`)).toHaveTextContent(/^prop foot$/);
    });

    it('未传入时不渲染头部与底部', () => {
        const view = render(ScrollListFixture, { props: { variant: 'empty' } });
        expect(view.container.querySelector(`.${prefix}-header`)).toBeNull();
        expect(view.container.querySelector(`.${prefix}-footer`)).toBeNull();
    });

    it('被命名时根元素为 group，data-* 与 class 落在根元素', () => {
        const view = render(ScrollListFixture, { props: { variant: 'named' } });
        expect(screen.getByRole('group', { name: 'time' })).toBe(view.container.firstElementChild);
        expect(screen.getByTestId('list')).toBe(view.container.firstElementChild);
    });

    it('读取 semiGlobal overrideDefaultProps 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { ScrollItem: { mode: 'normal' } };
        const view = renderItem({ list: numbers(3) });
        expect(view.container.querySelector(`.${prefix}-item`)).toBeInTheDocument();
        expect(view.container.querySelector(`.${prefix}-item-wheel`)).toBeNull();
    });
});

describe('ScrollItem 行为', () => {
    beforeEach(() => {
        vi.useRealTimers();
    });

    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('normal 模式渲染 items、选中类名、转换后的文本与禁用项', () => {
        const list = [{ value: 'a' }, { value: 'b', transform: (v: string) => `item-${v}` }, { value: 'c', disabled: true }];
        const transform = (v: string) => `common-${v}`;
        const view = renderItem({ list, mode: 'normal', selectedIndex: 0, transform, class: 'col', style: 'color: red', 'aria-label': 'letters' });
        const root = view.container.firstElementChild as Element;
        expect(root).toHaveClass(`${prefix}-item`, 'col');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(screen.getByRole('listbox', { name: 'letters' })).toBeInTheDocument();
        expect(root).not.toHaveAttribute('aria-label');
        expect(getItemTexts(root)).toEqual(['common-a', 'b', 'c']);
        const options = screen.getAllByRole('option');
        expect(options[0]).toHaveClass(`${prefix}-item-sel`);
        expect(options[2]).toHaveClass(`${prefix}-item-disabled`);
        expect(options[2]).toHaveAttribute('aria-disabled', 'true');
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

    it('wheel 模式点击在防抖后选中，且每次点击只发出一次 select', async () => {
        const onSelect = vi.fn<SelectHandler>();
        renderItem({ type: 'n', list: numbers(5), onSelect });
        await userEvent.click(screen.getAllByRole('option')[3]);
        expect(onSelect).not.toHaveBeenCalled();
        await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
        await sleep(100);
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith({ value: 3, type: 'n', index: 3 });
    });

    it('循环 wheel 模式在需要副本填满视图时将列表渲染三次，副本对辅助技术隐藏', async () => {
        mockRects();
        const list = numbers(12);
        const view = renderItem({ cycled: true, list, selectedIndex: 2 });
        await tick();
        expect(view.container.querySelector(`.${prefix}-list-outer-nocycle`)).toBeNull();
        const all = [...view.container.querySelectorAll('li')];
        expect(all).toHaveLength(36);
        expect(all.slice(12, 24).map((li) => li.textContent?.trim())).toEqual(list.map(({ value }) => String(value)));
        expect(getItemTexts(view.container)).toEqual(list.map(({ value }) => String(value)));
        expect(screen.getAllByRole('option', { selected: true })).toHaveLength(1);
        expect(all.filter((li) => li.getAttribute('aria-hidden') === 'true')).toHaveLength(24);
        expect(all.filter((li) => li.id)).toHaveLength(12);
    });

    it('挂载时把选中项滚动到中间', () => {
        mockItemLayout();
        const view = renderItem({ list: numbers(10), mode: 'normal', motion: false, selectedIndex: 0 });
        const wrapper = view.container.firstElementChild as Element;
        // the first item has offsetTop 0, which the scroll target treats as unknown and falls back to the list middle
        expect(wrapper.scrollTop).toBe(108);
    });

    it('bind:selectedIndex 点击后写回父级，父级改值后选中类随之移动并滚动到中间', async () => {
        mockItemLayout();
        const { store, click, option } = setupModes('bind', 0);
        await click('c');
        expect(store.index).toBe(2);
        expect(store.log).toEqual(['select 2']);
        expect(option('c')).toHaveClass(`${prefix}-item-sel`);
        expect(option('a')).not.toHaveClass(`${prefix}-item-sel`);
        store.index = 1;
        flushSync();
        expect(option('b')).toHaveClass(`${prefix}-item-sel`);
        const wrapper = option('a').closest(`.${prefix}-item`) as Element;
        await waitFor(() => expect(wrapper.scrollTop).toBe(36 - 72));
    });

    it('函数绑定：setter 拒绝时选中项保持不变', async () => {
        const { store, click, option } = setupModes('function', 0, false);
        await click('c');
        expect(store.log).toEqual(['set 2', 'select 2']);
        expect(store.index).toBe(0);
        expect(option('a')).toHaveClass(`${prefix}-item-sel`);
        expect(option('c')).not.toHaveClass(`${prefix}-item-sel`);
    });

    it('函数绑定：setter 接受时选中项跟随', async () => {
        const { store, click, option } = setupModes('function', 0, true);
        await click('b');
        expect(store.index).toBe(1);
        expect(option('b')).toHaveClass(`${prefix}-item-sel`);
    });

    it('单向传值只作初值：交互后本地覆盖，父级再推新值时以父级为准', async () => {
        const { store, click, option } = setupModes('one-way', 1);
        expect(option('b')).toHaveClass(`${prefix}-item-sel`);
        await click('c');
        expect(store.index).toBe(1);
        expect(option('c')).toHaveClass(`${prefix}-item-sel`);
        store.index = 0;
        flushSync();
        expect(option('a')).toHaveClass(`${prefix}-item-sel`);
    });

    it('不传 selectedIndex：默认选中第一项，点击后自行切换', async () => {
        const { click, option } = setupModes('uncontrolled');
        expect(option('a')).toHaveAttribute('aria-selected', 'true');
        await click('b');
        expect(option('b')).toHaveAttribute('aria-selected', 'true');
        expect(option('a')).toHaveAttribute('aria-selected', 'false');
    });

    it('motion 开启时，selectedIndex 变化后滚动带动画', async () => {
        mockItemLayout();
        const { store, option } = setupModes('bind', 0);
        const wrapper = option('a').closest(`.${prefix}-item`) as Element;
        store.index = 2;
        flushSync();
        await waitFor(() => expect(wrapper.scrollTop).toBe(72 - 72));
    });

    it('组件实例的 scrollToIndex() 滚动回选中项', async () => {
        mockItemLayout();
        const view = render(ScrollItem, { props: { list: numbers(10), mode: 'normal', motion: false, selectedIndex: 4 } });
        const wrapper = view.container.firstElementChild as Element;
        expect(wrapper.scrollTop).toBe(72);
        wrapper.scrollTop = 0;
        (view.component as unknown as ScrollItemHandle).scrollToIndex();
        expect(wrapper.scrollTop).toBe(72);
    });

    it('卸载后不发出 select', async () => {
        const onSelect = vi.fn<SelectHandler>();
        const view = renderItem({ cycled: true, list: numbers(5), onSelect });
        await userEvent.click(screen.getAllByRole('option')[3]);
        view.unmount();
        await sleep(100);
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('两种模式下都能渲染空列表', () => {
        expect(() => renderItem({ list: [] })).not.toThrow();
        expect(() => renderItem({ mode: 'normal' })).not.toThrow();
    });

    it('aria-labelledby 与 aria-describedby 落在 listbox 上，data-* 落在根元素', () => {
        const view = renderItem({ list: numbers(3), 'aria-labelledby': 'a', 'aria-describedby': 'b', 'data-testid': 'col' });
        const listbox = screen.getByRole('listbox');
        expect(listbox.tagName).toBe('UL');
        expect(listbox).toHaveAttribute('aria-labelledby', 'a');
        expect(listbox).toHaveAttribute('aria-describedby', 'b');
        expect(screen.getByTestId('col')).toBe(view.container.firstElementChild);
        expect(view.container.querySelector('div[aria-labelledby], div[aria-describedby]')).toBeNull();
    });

    it('normal 模式没有外层列表包装，ul 不带类名', () => {
        const view = renderItem({ list: numbers(3), mode: 'normal' });
        expect(view.container.querySelector(`.${prefix}-list-outer`)).toBeNull();
        const listbox = screen.getByRole('listbox');
        expect(listbox.parentElement).toBe(view.container.firstElementChild);
        expect(listbox).not.toHaveAttribute('class');
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

    it.each(['normal', 'wheel'] as const)('%s 模式：listbox 获得焦点，active descendant 指向选中的选项', async (mode) => {
        renderItem({ list: numbers(3), mode, selectedIndex: 1, 'aria-label': 'hour' });
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
        renderItem({ type: 'fruit', list, mode: 'normal', selectedIndex: 0, onSelect });
        screen.getByRole('listbox').focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(onSelect).toHaveBeenLastCalledWith({ value: 'cherry', type: 'fruit', index: 2 });
        // the selection wrote back locally, so End and Home continue from cherry
        await userEvent.keyboard('{End}');
        expect(onSelect).toHaveBeenLastCalledWith({ value: 'cocoa', type: 'fruit', index: 3 });
        await userEvent.keyboard('{Home}');
        expect(onSelect).toHaveBeenLastCalledWith({ value: 'apple', type: 'fruit', index: 0 });
    });

    it('循环列表用方向键首尾相接', async () => {
        const onSelect = vi.fn<SelectHandler>();
        renderItem({ type: 'n', cycled: true, list: numbers(3), selectedIndex: 2, onSelect });
        screen.getByRole('listbox').focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(onSelect).toHaveBeenLastCalledWith({ value: 0, type: 'n', index: 0 });
    });

    it('读取全局默认的 transform 函数，传入的优先', () => {
        semiGlobal.config.overrideDefaultProps = {
            ScrollItem: { transform: (v: ScrollListItem['value']) => `g-${v}` },
        };
        const view = renderItem({ list: numbers(2), mode: 'normal', selectedIndex: 0 });
        expect(getItemTexts(view.container)).toEqual(['g-0', '1']);
        view.unmount();
        const own = renderItem({ list: numbers(2), mode: 'normal', selectedIndex: 0, transform: (v: ScrollListItem['value']) => `own-${v}` });
        expect(getItemTexts(own.container)).toEqual(['own-0', '1']);
    });

    it('全局默认的 selectedIndex 生效', () => {
        semiGlobal.config.overrideDefaultProps = { ScrollItem: { selectedIndex: 2 } };
        renderItem({ list: numbers(3), mode: 'normal' });
        const listbox = screen.getByRole('listbox');
        expect(document.getElementById(listbox.getAttribute('aria-activedescendant') ?? '')).toHaveTextContent(/^2$/);
    });
});
