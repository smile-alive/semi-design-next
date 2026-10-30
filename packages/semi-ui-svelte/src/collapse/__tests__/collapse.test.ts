import { flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal, { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import CollapseHost from './collapse-host.svelte';
import Standalone from './standalone-panel.svelte';
import Variants from './variants.svelte';

const prefixCls = `${BASE_CLASS_PREFIX}-collapse`;

function setup(props: Record<string, unknown> = {}, options: { context?: Map<unknown, unknown> } = {}) {
    const store = createStore<{ log: string[] } & Record<string, unknown>>({ log: [], ...props });
    const view = render(CollapseHost, { props: { store }, ...options });
    const update = (next: Record<string, unknown>) => {
        Object.assign(store, next);
        flushSync();
    };
    return { store, view, container: view.container, update };
}

const getHeaders = () => screen.getAllByRole('button');
const getRows = (container: Element) => [...container.querySelectorAll<HTMLElement>(`.${prefixCls}-header`)];
const expectExpanded = (expected: boolean[]) => expect(getHeaders().map((header) => header.getAttribute('aria-expanded'))).toEqual(expected.map(String));
async function click(element: Element) {
    await userEvent.click(element);
    flushSync();
}

describe('Svelte Collapse', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('Collapse 自定义 class 与 style', () => {
        const { container } = setup({ collapse: { class: 'test', style: 'color: red' } });
        const collapse = container.querySelector(`.${prefixCls}`);
        expect(collapse).toHaveClass('test');
        expect(collapse).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('未知属性传到根元素', () => {
        const { container } = setup({ collapse: { 'aria-label': 'faq', id: 'faq', 'data-foo': 'bar' } });
        const root = container.querySelector(`.${prefixCls}`);
        expect(root).toHaveAttribute('aria-label', 'faq');
        expect(root).toHaveAttribute('id', 'faq');
        expect(root).toHaveAttribute('data-foo', 'bar');
    });

    it('自定义 expandIcon 与 collapseIcon', async () => {
        const { container } = setup({ icons: true });
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-plus`)).toHaveLength(3);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-icon-minus`)).toBeNull();
        await click(getHeaders()[0]);
        expect(getRows(container)[0].querySelector(`.${BASE_CLASS_PREFIX}-icon-minus`)).not.toBeNull();
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-plus`)).toHaveLength(2);
    });

    it('默认图标：收起态向下，展开态向上', async () => {
        const { container } = setup();
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-chevron_down`)).toHaveLength(3);
        await click(getHeaders()[0]);
        expect(getRows(container)[0].querySelector(`.${BASE_CLASS_PREFIX}-icon-chevron_up`)).not.toBeNull();
    });

    it('自定义 extra 内容', () => {
        const { container } = setup({ panel: { extra: '1234' } });
        expect(container.querySelector(`.${prefixCls}-header-right`)).toHaveTextContent('1234');
    });

    it('onChange 的载荷是 activeKey 数组与点击事件', async () => {
        const { store } = setup();
        await click(getHeaders()[2]);
        expect(store.log).toEqual(['change 3 click']);
    });

    it('可同时展开多个面板', async () => {
        const { store } = setup();
        await click(getHeaders()[1]);
        await click(getHeaders()[2]);
        expect(store.log.at(-1)).toBe('change 2,3 click');
        expectExpanded([false, true, true]);
    });

    it('手风琴模式只允许展开一个面板', async () => {
        const { store } = setup({ collapse: { accordion: true } });
        await click(getHeaders()[0]);
        await click(getHeaders()[2]);
        expect(store.log.at(-1)).toBe('change 3 click');
        expectExpanded([false, false, true]);
    });

    it('手风琴关闭已展开面板，并以数组形式通知', async () => {
        const { store } = setup({ collapse: { accordion: true } });
        await click(getHeaders()[1]);
        await click(getHeaders()[1]);
        expect(store.log.at(-1)).toBe('change  click');
        expectExpanded([false, false, false]);
    });

    it('禁用面板', () => {
        const { container } = setup({ panel: { disabled: true } });
        const rows = getRows(container);
        expect(rows[0]).toHaveClass(`${prefixCls}-header-disabled`);
        expect(getHeaders()[0]).toBeDisabled();
        expect(rows[1]).not.toHaveClass(`${prefixCls}-header-disabled`);
        expect(getHeaders()[1]).toBeEnabled();
    });

    it('禁用面板忽略点击，展开图标显示为禁用态', async () => {
        const { container, store } = setup({ panel: { disabled: true } });
        await click(getHeaders()[0]);
        expect(store.log).toEqual([]);
        expectExpanded([false, false, false]);
        const icons = container.querySelectorAll(`.${prefixCls}-header-icon`);
        expect(icons[0]).toHaveClass(`${prefixCls}-header-iconDisabled`);
        expect(icons[1]).not.toHaveClass(`${prefixCls}-header-iconDisabled`);
    });

    it('每个标题是原生 button，名称为标题文本，位于三级标题内', () => {
        setup();
        const headings = screen.getAllByRole('heading', { level: 3 });
        expect(headings).toHaveLength(3);
        const button = screen.getByRole('button', { name: 'This is panel header 1' });
        expect(button.tagName).toBe('BUTTON');
        expect(button).toHaveAttribute('type', 'button');
        expect(headings[0]).toContainElement(button);
        expect(headings[0]).toHaveAccessibleName('This is panel header 1');
    });

    it('隐藏面板图标', () => {
        const { container } = setup({ panel: { showArrow: false } });
        expect(container.querySelectorAll(`.${prefixCls}-header-icon`)).toHaveLength(2);
        expect(getRows(container)[0].querySelector(`.${prefixCls}-header-icon`)).toBeNull();
    });

    it('生成的面板 id 是合法的 CSS id 选择器', async () => {
        setup({ collapse: { motion: false } });
        await click(getHeaders()[1]);
        const id = getHeaders()[1].getAttribute('aria-controls') as string;
        expect(document.querySelector(`#${id}`)).toHaveTextContent('Hi, bytedance dance dance.');
    });

    it('data-*、class 与 style 传到面板元素', () => {
        const { container } = setup({ panel: { class: 'mine', style: 'color: red', 'data-testid': 'panel' } });
        expect(screen.getByTestId('panel')).toBe(container.querySelector(`.${prefixCls}-item`));
        expect(screen.getByTestId('panel')).toHaveClass('mine');
        expect(screen.getByTestId('panel')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('expandIconPosition 为 left 时图标位于标题文本之前', () => {
        const { container } = setup({ collapse: { expandIconPosition: 'left' } });
        const row = getRows(container)[0];
        expect(row).toHaveClass(`${prefixCls}-header-iconLeft`);
        expect(row.firstElementChild).toHaveClass(`${prefixCls}-header-icon`);
        expect(container.querySelectorAll(`.${prefixCls}-header-right .${prefixCls}-header-icon`)).toHaveLength(0);
    });

    it('expandIconPosition 为 right 时图标位于 extra 之后', () => {
        const { container } = setup({ panel: { extra: 'more' } });
        const row = getRows(container)[0];
        const right = row.querySelector(`.${prefixCls}-header-right`) as HTMLElement;
        expect(right).toHaveTextContent('more');
        expect(right.lastElementChild).toHaveClass(`${prefixCls}-header-icon`);
        expect(row).not.toHaveClass(`${prefixCls}-header-iconLeft`);
    });

    it('clickHeaderToExpand 为 false 时，切换 expandIconPosition 后点击图标仍能切换', async () => {
        const { container, update, store } = setup({ collapse: { clickHeaderToExpand: false } });
        update({ collapse: { clickHeaderToExpand: false, expandIconPosition: 'left' } });
        await click(container.querySelector(`.${prefixCls}-header-icon`) as HTMLElement);
        expect(store.log).toEqual(['change 1 click']);
    });

    it('clickHeaderToExpand 为 false 时仅点击按钮与图标切换，不响应整行点击', async () => {
        const { container, store } = setup({ collapse: { clickHeaderToExpand: false }, panel: { extra: 'more' } });
        await click(screen.getByText('more'));
        await click(getRows(container)[0]);
        expect(store.log).toEqual([]);
        expectExpanded([false, false, false]);
        await click(container.querySelector(`.${prefixCls}-header-icon`) as HTMLElement);
        expect(store.log.at(-1)).toBe('change 1 click');
        expectExpanded([true, false, false]);
        await click(screen.getByText('This is panel header 2'));
        expect(store.log.at(-1)).toBe('change 1,2 click');
        expectExpanded([true, true, false]);
    });

    it('clickHeaderToExpand 为 true 时点击整行（包括 extra）均可切换', async () => {
        const { container, store } = setup({ panel: { extra: 'more' } });
        await click(screen.getByText('more'));
        expectExpanded([true, false, false]);
        await click(getRows(container)[0]);
        expectExpanded([false, false, false]);
        expect(store.log).toHaveLength(2);
    });

    it('未设置 keepDOM 时，折叠内容会被卸载', async () => {
        const first = setup({ collapse: { motion: false } });
        await click(getHeaders()[0]);
        expect(first.container.querySelectorAll(`.${prefixCls}-content-wrapper`)).toHaveLength(1);
        await click(getHeaders()[0]);
        expect(first.container.querySelectorAll(`.${prefixCls}-content-wrapper`)).toHaveLength(0);
        first.view.unmount();

        const kept = setup({ collapse: { motion: false, keepDOM: true } });
        expect(kept.container.querySelectorAll(`.${prefixCls}-content-wrapper`)).toHaveLength(3);
    });

    it('keepDOM 与 lazyRender 同时使用时，内容首次展开后挂载并保留', async () => {
        const { container } = setup({ collapse: { motion: false, keepDOM: true, lazyRender: true } });
        expect(container.querySelectorAll(`.${prefixCls}-content-wrapper`)).toHaveLength(0);
        await click(getHeaders()[1]);
        expect(container.querySelectorAll(`.${prefixCls}-content-wrapper`)).toHaveLength(1);
        await click(getHeaders()[1]);
        expectExpanded([false, false, false]);
        expect(container.querySelectorAll(`.${prefixCls}-content-wrapper`)).toHaveLength(1);
    });

    it('内容与标题携带展开状态', async () => {
        const { container } = setup({ collapse: { motion: false, keepDOM: true } });
        const items = container.querySelectorAll(`.${prefixCls}-item`);
        const inert = (index: number) => (items[index].querySelector(`.${prefixCls}-content`) as HTMLElement & { inert?: boolean }).inert;
        expect(items[0]).not.toHaveClass(`${prefixCls}-item-active`);
        expect(inert(0)).toBe(true);
        await click(getHeaders()[0]);
        expect(items[0]).toHaveClass(`${prefixCls}-item-active`);
        expect(inert(0)).toBeFalsy();
    });

    it('标题获得焦点后，Enter 与 Space 切换面板', async () => {
        const { store } = setup();
        getHeaders()[0].focus();
        await userEvent.keyboard('{Enter}');
        flushSync();
        expectExpanded([true, false, false]);
        await userEvent.keyboard(' ');
        flushSync();
        expectExpanded([false, false, false]);
        expect(store.log).toEqual(['change 1 click', 'change  click']);
    });

    it('标题控制内容，内容为由标题命名的 region', async () => {
        const { container } = setup({ collapse: { motion: false } });
        const [header] = getHeaders();
        // collapsed without keepDOM: no content in the DOM, so no dangling aria-controls
        expect(header).not.toHaveAttribute('aria-controls');
        await click(header);
        const region = document.getElementById(header.getAttribute('aria-controls') as string) as HTMLElement;
        expect(region).toHaveClass(`${prefixCls}-content`);
        expect(region).toHaveAttribute('role', 'region');
        expect(region).toHaveAttribute('aria-labelledby', header.id);
        expect(container.querySelector(`#${header.id}`)).toBe(header);
    });

    it('首次渲染时标题的 aria-controls 指向内容 id，且每个面板唯一', () => {
        setup({ collapse: { keepDOM: true, motion: false } });
        const ids = getHeaders().map((header) => header.getAttribute('aria-controls') as string);
        expect(new Set(ids).size).toBe(3);
        ids.forEach((id) => {
            expect(id).toMatch(new RegExp(`^${prefixCls}-`));
            expect(document.getElementById(id)).toHaveClass(`${prefixCls}-content`);
        });
    });

    it('keepDOM 加 lazyRender：展开过再收起，内容仍在 DOM 且 aria-controls 仍指向它', async () => {
        setup({ collapse: { keepDOM: true, lazyRender: true, motion: false } });
        expect(getHeaders()[1]).not.toHaveAttribute('aria-controls');
        await click(getHeaders()[1]);
        await click(getHeaders()[1]);
        expectExpanded([false, false, false]);
        const id = getHeaders()[1].getAttribute('aria-controls');
        expect(id).not.toBeNull();
        expect(document.getElementById(id as string)).not.toBeNull();
        expect(getHeaders()[2]).not.toHaveAttribute('aria-controls');
    });

    it('只设 Collapsible 的全局 keepDOM 时，收起面板的内容在 DOM 中且有 aria-controls', () => {
        semiGlobal.config.overrideDefaultProps = { Collapsible: { keepDOM: true } };
        setup({ collapse: { motion: false } });
        getHeaders().forEach((header) => {
            expect(document.getElementById(header.getAttribute('aria-controls') as string)).not.toBeNull();
        });
    });

    it('onMotionEnd 在面板的过渡结束时调用，不落到面板根元素', async () => {
        const { container } = render(Variants, { props: { variant: 'motion-end' } });
        const item = container.querySelector(`.${prefixCls}-item`) as HTMLElement;
        expect(item).not.toHaveAttribute('onmotionend');
        await click(getHeaders()[0]);
        await fireEvent.transitionEnd(item.querySelector('.semi-collapsible-wrapper') as HTMLElement, { propertyName: 'height' });
        expect(screen.getByLabelText('ends')).toHaveTextContent('1');
    });

    it('extra 与切换按钮并列，其自身的 button 不嵌套在切换按钮内', async () => {
        render(Variants, { props: { variant: 'extra-button' } });
        const toggle = screen.getByRole('button', { name: 'title' });
        const copy = screen.getByRole('button', { name: 'copy' });
        expect(toggle).not.toContainElement(copy);
        expect(screen.getByRole('heading')).not.toContainElement(copy);
        await click(copy);
        expect(screen.getByLabelText('changes')).toHaveTextContent('0');
    });

    it('extra 内 input 中的 Enter 与 Space 不切换面板', async () => {
        render(Variants, { props: { variant: 'extra-input' } });
        screen.getByLabelText('inner').focus();
        await userEvent.keyboard('{Enter} ');
        flushSync();
        expectExpanded([false]);
    });

    it('元素标题原样放入切换按钮，extra 并列其旁', () => {
        const { container } = render(Variants, { props: { variant: 'element-header' } });
        const [row] = getRows(container);
        expect(row.firstElementChild).toHaveClass(`${prefixCls}-header-icon`);
        expect(getHeaders()[0].firstElementChild).toBe(screen.getByTestId('node'));
        expect(getHeaders()[0]).toHaveAccessibleName('node header');
        expect(row.querySelector(`.${prefixCls}-header-right`)).toHaveTextContent('more');
    });

    it('没有 children 的面板图标禁用、无内容，但仍可切换', async () => {
        const { container } = render(Variants, { props: { variant: 'empty' } });
        const icon = () => container.querySelector(`.${prefixCls}-header-icon`);
        expect(icon()).toHaveClass(`${prefixCls}-header-iconDisabled`);
        expect(container.querySelector(`.${prefixCls}-content`)).toBeNull();
        expect(getHeaders()[0]).not.toHaveAttribute('aria-controls');
        await click(getHeaders()[0]);
        expect(screen.getByLabelText('changes')).toHaveTextContent('1');
        expect(icon()).toHaveClass(`${prefixCls}-header-iconDisabled`);
    });

    it('Panel 在 Collapse 之外渲染时抛出说明性错误', () => {
        expect(() => render(Standalone)).toThrow('Collapse.Panel must be used inside Collapse');
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', async () => {
        semiGlobal.config.overrideDefaultProps = { Collapse: { expandIconPosition: 'left', clickHeaderToExpand: false } };
        const first = setup();
        expect(getRows(first.container)[0]).toHaveClass(`${prefixCls}-header-iconLeft`);
        await click(getRows(first.container)[0]);
        expectExpanded([false, false, false]);
        first.view.unmount();
        const explicit = setup({ collapse: { expandIconPosition: 'right' } });
        expect(getRows(explicit.container)[0]).not.toHaveClass(`${prefixCls}-header-iconLeft`);
    });

    it('应用注入的 semiGlobal 默认值与全局单例隔离', async () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Collapse: { accordion: true } };
        setup({}, { context: new Map([[semiGlobalKey, semi]]) });
        await click(getHeaders()[0]);
        await click(getHeaders()[1]);
        expectExpanded([false, true, false]);
    });
});

describe('Svelte Collapse 受控值（$bindable）', () => {
    it('非受控：点击切换，onChange 收到新数组', async () => {
        const { store } = setup();
        await click(getHeaders()[0]);
        expectExpanded([true, false, false]);
        expect(store.log).toEqual(['change 1 click']);
    });

    it('bind:activeKey：点击写回父级，父级改值面板跟随', async () => {
        const { store, update } = setup({ mode: 'bind', activeKey: '1' });
        expectExpanded([true, false, false]);
        await click(getHeaders()[1]);
        expect(store.activeKey).toEqual(['1', '2']);
        expectExpanded([true, true, false]);
        update({ activeKey: ['3'] });
        expectExpanded([false, false, true]);
    });

    it("bind:activeKey 的 '' 与 null 是受控的空值，收起全部面板", async () => {
        const { store, update } = setup({ mode: 'bind', activeKey: ['2'] });
        for (const activeKey of ['', null]) {
            update({ activeKey: ['2'] });
            expectExpanded([false, true, false]);
            update({ activeKey });
            expectExpanded([false, false, false]);
            await click(getHeaders()[0]);
            expect(store.log.at(-1)).toBe('change 1 click');
            expect(store.activeKey).toEqual(['1']);
        }
    });

    it('bind:activeKey 重置为 undefined 后转为非受控，从最后的受控值继续', async () => {
        const { store, update } = setup({ mode: 'bind', activeKey: ['1'] });
        update({ activeKey: ['3'] });
        update({ activeKey: undefined });
        expectExpanded([false, false, true]);
        await click(getHeaders()[1]);
        expect(store.log.at(-1)).toBe('change 3,2 click');
        expectExpanded([false, true, true]);
    });

    it('bind:activeKey 以新数组传入相同的 key 不改变面板', () => {
        const { update } = setup({ mode: 'bind', activeKey: ['2'] });
        update({ activeKey: ['2'] });
        expectExpanded([false, true, false]);
    });

    it('函数绑定：setter 拒绝时面板保持原状', async () => {
        const { store } = setup({ mode: 'function', activeKey: ['1'], accept: false });
        await click(getHeaders()[1]);
        expect(store.log).toEqual(['set 1,2', 'change 1,2 click']);
        expect(store.activeKey).toEqual(['1']);
        expectExpanded([true, false, false]);
    });

    it('函数绑定：setter 接受时面板跟随', async () => {
        const { store } = setup({ mode: 'function', activeKey: ['1'], accept: true });
        await click(getHeaders()[1]);
        expect(store.activeKey).toEqual(['1', '2']);
        expectExpanded([true, true, false]);
    });

    it('单向传值：点击在本地覆盖并翻转，父级值不变；父级再推值时以父级为准', async () => {
        const { store, update } = setup({ mode: 'one-way', activeKey: ['1'] });
        await click(getHeaders()[0]);
        expect(store.log).toEqual(['change  click']);
        expect(store.activeKey).toEqual(['1']);
        expectExpanded([false, false, false]);
        update({ activeKey: ['2'] });
        expectExpanded([false, true, false]);
    });
});
