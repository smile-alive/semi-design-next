import { flushSync } from 'svelte';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { PaginationProps } from '../interface';
import Pagination from '../pagination.svelte';
import PaginationCase from './pagination-case.svelte';
import PaginationModes from './pagination-modes.svelte';
import PaginationSlots from './pagination-slots.svelte';

type Mode = 'bind' | 'function' | 'one-way' | 'uncontrolled';

const prefix = 'semi-page';
const defaultPageSize = 10;

const getPageItems = (container: Element) => [...container.querySelectorAll<HTMLButtonElement>(`.${prefix}-item`)];
const getActivePage = (container: Element) => container.querySelector(`.${prefix}-item-active`);
const pageName = (page: number) => zh_CN.Pagination.pageN.replace('${page}', String(page));
const getRestPages = () => within(document.querySelector<HTMLElement>(`.${prefix}-rest-list`) as HTMLElement).getAllByRole('button');
const getJumper = (container: Element) => container.querySelector(`.${prefix}-quickjump-input-number input`) as HTMLInputElement;
const getCounter = (container: Element) => container.querySelector(`.${prefix}-item-small`) as HTMLElement;
const getSelectionText = () => document.querySelector('.semi-select-selection-text');
const getPageTexts = (container: Element) =>
    getPageItems(container)
        .slice(1, -1)
        .map((item) => item.textContent?.trim());

// lets the foundation's timers and the effects they schedule run
async function settle() {
    flushSync();
    await new Promise((resolve) => setTimeout(resolve));
    flushSync();
    await Promise.resolve();
    flushSync();
}

async function click(target: Element) {
    await fireEvent.click(target);
    await settle();
}

async function hover(target: Element) {
    await fireEvent.mouseEnter(target);
    await settle();
}

async function type(input: HTMLInputElement, text: string) {
    input.value = text;
    await fireEvent.input(input);
    await settle();
}

async function chooseSize(label: string) {
    await click(document.querySelector('.semi-select') as Element);
    await click(await screen.findByRole('option', { name: label }));
}

// Pagination with a reactive props object; the callbacks are spies
function setup(props: PaginationProps = {}, extra: { locale?: typeof zh_CN; direction?: 'ltr' | 'rtl' } = {}) {
    const onChange = vi.fn<(page: number, size: number) => void>();
    const onPageChange = vi.fn<(page: number) => void>();
    const onPageSizeChange = vi.fn<(size: number) => void>();
    const store = createStore<{ props: PaginationProps; locale?: typeof zh_CN; direction?: 'ltr' | 'rtl' }>({ props: { onChange, onPageChange, onPageSizeChange, ...props }, ...extra });
    const view = render(PaginationCase, { props: { store } });
    flushSync();
    return { store, onChange, onPageChange, onPageSizeChange, ...view };
}

function setupModes(target: 'currentPage' | 'pageSize', mode: Mode, value?: number, accept = true) {
    const store = createStore<{ page: number | undefined; size: number | undefined; accept: boolean; log: string[] }>({ page: target === 'currentPage' ? value : undefined, size: target === 'pageSize' ? value : undefined, accept, log: [] });
    const view = render(PaginationModes, { props: { target, mode, store } });
    flushSync();
    return { store, ...view };
}

afterEach(() => {
    semiGlobal.config = {};
});

describe('Svelte Pagination 渲染', () => {
    it('total 与 pageSize', () => {
        const getPageChild = (props: PaginationProps) => {
            const view = setup(props);
            const children = (view.container.querySelector('ul') as HTMLElement).children;
            const result = { length: children.length, lastPage: children[children.length - 2].textContent?.trim() };
            view.unmount();
            return result;
        };
        expect(getPageChild({ total: 30 })).toEqual({ length: 5, lastPage: '3' });
        expect(getPageChild({ total: 70 })).toEqual({ length: 9, lastPage: '7' });
        expect(getPageChild({ total: 200 })).toEqual({ length: 9, lastPage: '20' });
        expect(getPageChild({ total: 200, pageSize: 50 })).toEqual({ length: 6, lastPage: '4' });
    });

    it('class、style 与 id、aria-*、data-* 落在根 ul，原生 click 也在根上', async () => {
        for (const size of ['default', 'small'] as const) {
            const onclick = vi.fn<(event: MouseEvent) => void>();
            const view = setup({ total: 200, size, id: 'pager', 'aria-label': 'Pages', 'data-foo': 'bar', class: 'mine', style: 'color: red', onclick });
            const root = view.container.querySelector('ul') as HTMLElement;
            expect(root).toHaveClass('mine', prefix);
            expect(root).toHaveAttribute('id', 'pager');
            expect(root).toHaveAttribute('data-foo', 'bar');
            expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
            expect(screen.getByRole('list', { name: 'Pages' })).toBe(root);
            await click(root);
            expect(onclick).toHaveBeenCalledTimes(1);
            view.unmount();
        }
    });

    it('渲染 small 尺寸：当前页/总页数，上一页下一页翻页，没有每页条数', async () => {
        const { container, onChange } = setup({ showQuickJumper: true, showSizeChanger: true, size: 'small', total: 90 });
        const root = container.querySelector('ul') as HTMLElement;
        expect(root).toHaveClass(prefix, `${prefix}-small`);
        expect(getCounter(container).textContent).toBe('1/9 ');
        expect(getCounter(container).tagName).toBe('DIV');
        await click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
        expect(getCounter(container).textContent).toBe('2/9 ');
        expect(onChange).toHaveBeenCalledWith(2, defaultPageSize);
        expect(container.querySelector(`.${prefix}-quickjump`)).not.toBeNull();
        expect(container.querySelector(`.${prefix}-switch`)).toBeNull();
    });

    it('showTotal 与 showSizeChanger', () => {
        const { container } = setup({ showSizeChanger: true, showTotal: true, total: 200 });
        expect(container.querySelector(`.${prefix}-total`)).toHaveTextContent(/^总页数：20$/);
        expect(container.querySelector(`.${prefix}-switch`)).not.toBeNull();
    });

    it('首页或末页时禁用上一页与下一页', () => {
        const getEnds = (props: PaginationProps) => {
            const view = setup(props);
            const result = [zh_CN.Pagination.prev, zh_CN.Pagination.next].map((name) => {
                const button = screen.getByRole<HTMLButtonElement>('button', { name });
                expect(button.classList.contains(`${prefix}-item-disabled`)).toBe(button.disabled);
                return button.disabled;
            });
            view.unmount();
            return result;
        };
        expect(getEnds({ total: 30 })).toEqual([true, false]);
        expect(getEnds({ total: 200, currentPage: 20 })).toEqual([false, true]);
        expect(getEnds({ total: 9 })).toEqual([true, true]);
    });

    it('hideOnSinglePage', () => {
        const { container, store } = setup({ hideOnSinglePage: true, total: 10 });
        expect(container.querySelector(`.${prefix}`)).toBeNull();
        store.props.total = 11;
        flushSync();
        expect(container.querySelector(`.${prefix}`)).not.toBeNull();
    });

    it('页数超过 7 时以当前页为中心截断', () => {
        const { container, store } = setup({ currentPage: 1, total: 200 });
        expect(getPageTexts(container)).toEqual(['1', '2', '3', '4', '...', '19', '20']);
        for (const [page, expected] of [
            [4, ['1', '2', '3', '4', '5', '...', '20']],
            [10, ['1', '...', '9', '10', '11', '...', '20']],
            [17, ['1', '...', '16', '17', '18', '19', '20']],
        ] as const) {
            store.props.currentPage = page;
            flushSync();
            expect(getPageTexts(container)).toEqual(expected);
        }
        store.props.total = 70;
        store.props.currentPage = 7;
        flushSync();
        expect(getPageTexts(container)).toEqual(['1', '2', '3', '4', '5', '6', '7']);
    });

    it('页码按钮标记当前页，名称取语言包', () => {
        const { container } = setup({ currentPage: 10, showQuickJumper: true, showSizeChanger: true, showTotal: true, total: 200 });
        const list = screen.getByRole('list');
        expect([...list.children].every((child) => child.tagName === 'LI')).toBe(true);
        expect(getActivePage(container)).toHaveAttribute('aria-current', 'page');
        expect(screen.getByRole('button', { name: pageName(10) })).toHaveAttribute('aria-current', 'page');
        expect(screen.getByRole('button', { name: pageName(9) })).not.toHaveAttribute('aria-current');
        expect(screen.getAllByRole('button', { name: zh_CN.Pagination.more })).toHaveLength(2);
        expect(screen.getByRole('combobox')).toHaveAccessibleName(zh_CN.Pagination.pageSizeSelector);
        expect(screen.getByRole('spinbutton', { name: zh_CN.Pagination.jumpTo })).toBeInTheDocument();
    });

    it('内部控件不接收使用方的 aria-label', () => {
        setup({ 'aria-label': 'Pages', showQuickJumper: true, showSizeChanger: true, total: 200 });
        expect(screen.getByRole('combobox')).toHaveAccessibleName(zh_CN.Pagination.pageSizeSelector);
        expect(screen.getByRole('spinbutton')).toHaveAccessibleName(zh_CN.Pagination.jumpTo);
    });

    it('禁用所有页码、尺寸切换器与省略号弹层', async () => {
        const { container, onChange } = setup({ currentPage: 5, disabled: true, showSizeChanger: true, total: 200 });
        expect(container.querySelector('ul')).toHaveClass(`${prefix}-disabled`);
        expect(getActivePage(container)).toHaveClass(`${prefix}-item-all-disabled-active`);
        expect(getPageItems(container).every((button) => button.disabled)).toBe(true);
        // userEvent skips disabled buttons the way a browser does; fireEvent would dispatch to them
        await userEvent.click(screen.getByRole('button', { name: pageName(6) }));
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
        expect(onChange).not.toHaveBeenCalled();
        expect(container.querySelector('.semi-select')).toHaveClass('semi-select-disabled');
        await hover(screen.getAllByRole('button', { name: zh_CN.Pagination.more })[0]);
        expect(document.querySelector(`.${prefix}-rest-list`)).toBeNull();
    });

    it('showSizeChanger 与 hideOnSinglePage 同用时，单页仍显示并警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { container } = setup({ hideOnSinglePage: true, showSizeChanger: true, total: 10 });
        expect(container.querySelector(`.${prefix}-switch`)).not.toBeNull();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('[Semi Pagination]'));
    });

    it('small 下 showSizeChanger 不生效：单页仍隐藏且不警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { container } = setup({ hideOnSinglePage: true, showSizeChanger: true, size: 'small', total: 5 });
        expect(container.querySelector('ul')).toBeNull();
        expect(warn).not.toHaveBeenCalled();
    });
});

describe('Svelte Pagination 交互与事件', () => {
    it('点击页码：pageChange 与 change 各一次，当前页跟随', async () => {
        const { container, onChange, onPageChange } = setup({ total: 70 });
        await click(getPageItems(container)[7]);
        expect(onPageChange.mock.calls).toEqual([[7]]);
        expect(onChange.mock.calls).toEqual([[7, defaultPageSize]]);
        expect(getActivePage(container)).toHaveTextContent(/^7$/);
    });

    it('点击当前页与省略号不触发事件', async () => {
        const { container, onChange } = setup({ total: 200 });
        await click(getPageItems(container)[7]);
        expect(onChange).toHaveBeenCalledTimes(1);
        await click(getActivePage(container) as Element);
        await click(screen.getByRole('button', { name: zh_CN.Pagination.more }));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getActivePage(container)).toHaveTextContent(/^20$/);
    });

    it('上一页、下一页每次点击各发出一次事件，禁用的一端不发出', async () => {
        const { onChange, onPageChange } = setup({ total: 30 });
        await click(screen.getByRole('button', { name: zh_CN.Pagination.prev }));
        expect(onChange).not.toHaveBeenCalled();
        for (let i = 0; i < 3; i++) await click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
        expect(onPageChange.mock.calls).toEqual([[2], [3]]);
        expect(onChange.mock.calls).toEqual([
            [2, 10],
            [3, 10],
        ]);
        expect(screen.getByRole('button', { name: zh_CN.Pagination.next })).toBeDisabled();
        await click(screen.getByRole('button', { name: zh_CN.Pagination.prev }));
        expect(onChange.mock.lastCall).toEqual([2, 10]);
    });

    it('切换 pageSize 时重新计算当前页，事件顺序为 pageSize 先于 page', async () => {
        const order: string[] = [];
        const { container, onChange, onPageChange, onPageSizeChange } = setup({ currentPage: undefined, showSizeChanger: true, total: 200 });
        onPageSizeChange.mockImplementation(() => order.push('pageSize'));
        onPageChange.mockImplementation(() => order.push('page'));
        onChange.mockImplementation(() => order.push('change'));
        await click(screen.getByRole('button', { name: pageName(4) }));
        await click(screen.getByRole('button', { name: pageName(5) }));
        order.length = 0;
        await chooseSize('每页条数：20');
        await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(3, 20));
        expect(order).toEqual(['pageSize', 'page', 'change']);
        expect(onPageSizeChange.mock.calls).toEqual([[20]]);
        expect(getActivePage(container)).toHaveTextContent(/^3$/);
    });

    it('设置 preventPageChangeOnPageSizeChange 后切换 pageSize 保持当前页', async () => {
        const { container, onChange, onPageChange } = setup({ preventPageChangeOnPageSizeChange: true, showSizeChanger: true, total: 200 });
        await click(screen.getByRole('button', { name: pageName(3) }));
        onPageChange.mockClear();
        await chooseSize('每页条数：20');
        await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(3, 20));
        expect(onPageChange).not.toHaveBeenCalled();
        expect(getActivePage(container)).toHaveTextContent(/^3$/);
    });

    it('pageSizeOpts 与缺少的 pageSize 按顺序插入', async () => {
        setup({ pageSizeOpts: [10, 20, 40], pageSize: 30, showSizeChanger: true, total: 200 });
        await click(document.querySelector('.semi-select') as Element);
        expect(screen.getAllByRole('option').map((option) => option.textContent?.trim())).toEqual(['每页条数：10', '每页条数：20', '每页条数：30', '每页条数：40']);
    });

    it('比所有选项都大的 pageSize 排在最后', async () => {
        setup({ pageSize: 200, showSizeChanger: true, total: 2000 });
        await click(document.querySelector('.semi-select') as Element);
        expect(screen.getAllByRole('option').map((option) => option.textContent?.trim())).toEqual(['每页条数：10', '每页条数：20', '每页条数：40', '每页条数：100', '每页条数：200']);
    });

    it('悬停省略号列出隐藏页码，点击后跳转', async () => {
        const { container, onChange } = setup({ currentPage: 10, total: 200 });
        const [left, right] = screen.getAllByRole('button', { name: zh_CN.Pagination.more });
        await hover(left);
        await waitFor(() => expect(getRestPages().map((el) => el.textContent?.trim())).toEqual(['2', '3', '4', '5', '6', '7', '8']));
        expect(getRestPages()[0]).toHaveAccessibleName(pageName(2));
        await fireEvent.mouseLeave(left);
        await hover(right);
        await waitFor(() => expect(screen.getByRole('button', { name: pageName(12) })).toBeInTheDocument());
        await click(screen.getByRole('button', { name: pageName(12) }));
        expect(onChange).toHaveBeenCalledWith(12, defaultPageSize);
        expect(container.querySelector(`.${prefix}-item-active`)).not.toBeNull();
    });

    it('small 尺寸设置 hoverShowPageSelect 后悬停列出所有页码', async () => {
        const { container, onChange } = setup({ hoverShowPageSelect: true, size: 'small', total: 90 });
        expect(getCounter(container).tagName).toBe('BUTTON');
        await hover(getCounter(container));
        await waitFor(() => expect(screen.getByRole('button', { name: pageName(1) })).toBeInTheDocument());
        await click(screen.getByRole('button', { name: pageName(3) }));
        expect(onChange).toHaveBeenCalledWith(3, defaultPageSize);
        expect(getCounter(container).textContent).toBe('3/9 ');
    });

    it('隐藏页码列表按 ConfigProvider 的 direction 布局', async () => {
        setup({ total: 200 }, { direction: 'rtl' });
        await hover(screen.getByRole('button', { name: zh_CN.Pagination.more }));
        await waitFor(() => expect(document.querySelector(`.${prefix}-rest-list`)).toHaveStyle({ direction: 'rtl' }));
    });
});

describe('Svelte Pagination 快速跳转', () => {
    it('输入页码后失焦跳转，超出范围取边界，Enter 跳转后清空输入框', async () => {
        const { container, onChange } = setup({ showQuickJumper: true, total: 200 });
        const jumper = getJumper(container);
        jumper.focus();
        await type(jumper, '5');
        jumper.blur();
        await settle();
        expect(onChange.mock.calls).toEqual([[5, defaultPageSize]]);
        expect(getActivePage(container)).toHaveTextContent(/^5$/);

        jumper.focus();
        await type(jumper, '21');
        jumper.blur();
        await settle();
        expect(getActivePage(container)).toHaveTextContent(/^20$/);

        await type(jumper, '-1');
        await fireEvent.keyDown(jumper, { key: 'Enter' });
        await settle();
        expect(getActivePage(container)).toHaveTextContent(/^1$/);
        expect(jumper).toHaveValue('');
    });

    it('没有有效数字时忽略 Enter', async () => {
        const { container } = setup({ currentPage: 20, showQuickJumper: true, total: 200 });
        await fireEvent.keyDown(getJumper(container), { key: 'Enter' });
        await settle();
        expect(getActivePage(container)).toHaveTextContent(/^20$/);
    });

    it('按 Enter 跳转，忽略当前页', async () => {
        const { container, onChange } = setup({ showQuickJumper: true, total: 200 });
        const jumper = getJumper(container);
        await type(jumper, '7');
        await fireEvent.keyDown(jumper, { key: 'Enter' });
        await settle();
        expect(onChange.mock.calls).toEqual([[7, defaultPageSize]]);
        expect(jumper).toHaveValue('');
        await type(jumper, '7');
        await fireEvent.keyDown(jumper, { key: 'Enter' });
        await settle();
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('输入法组合中按 Enter 不跳转', async () => {
        const { container, onChange } = setup({ showQuickJumper: true, total: 200 });
        const jumper = getJumper(container);
        await type(jumper, '7');
        await fireEvent.keyDown(jumper, { key: 'Enter', isComposing: true });
        await settle();
        expect(onChange).not.toHaveBeenCalled();
        await fireEvent.keyDown(jumper, { key: 'Enter' });
        await settle();
        expect(onChange.mock.calls).toEqual([[7, defaultPageSize]]);
    });

    it('小数页码取整', async () => {
        const { container, onChange } = setup({ showQuickJumper: true, total: 200 });
        const jumper = getJumper(container);
        await type(jumper, '2.5');
        await fireEvent.keyDown(jumper, { key: 'Enter' });
        await settle();
        expect(onChange.mock.calls).toEqual([[2, defaultPageSize]]);
    });

    it('只有一页、没有页或 pagination 被禁用时不可用', () => {
        const { container, store } = setup({ showQuickJumper: true, total: 10 });
        expect(container.querySelector(`.${prefix}-quickjump`)).toHaveClass(`${prefix}-quickjump-disabled`);
        expect(getJumper(container)).toBeDisabled();
        Object.assign(store.props, { disabled: true, total: 200 });
        flushSync();
        expect(getJumper(container)).toBeDisabled();
        Object.assign(store.props, { disabled: false, total: 0 });
        flushSync();
        expect(getJumper(container)).toBeDisabled();
        store.props.total = 200;
        flushSync();
        expect(getJumper(container)).toBeEnabled();
    });

    it('全局 InputNumber 默认值不给快速跳转框加清除按钮', async () => {
        semiGlobal.config.overrideDefaultProps = { InputNumber: { showClear: true } };
        const { container } = setup({ showQuickJumper: true, total: 200 });
        await type(getJumper(container), '3');
        expect(container.querySelector('.semi-input-clearbtn')).toBeNull();
    });
});

describe('Svelte Pagination 受控值（currentPage）', () => {
    const active = () => document.querySelector(`.${prefix}-item-active`)?.textContent?.trim();

    it('不传：点击切换，事件携带新页码', async () => {
        const { store } = setupModes('currentPage', 'uncontrolled');
        await click(screen.getByRole('button', { name: pageName(3) }));
        expect(active()).toBe('3');
        expect(store.log).toEqual(['page 3', 'change 3/10']);
    });

    it('bind:currentPage：点击写回父级，父级改值后高亮跟随', async () => {
        const { store } = setupModes('currentPage', 'bind', 1);
        await click(screen.getByRole('button', { name: pageName(3) }));
        expect(store.page).toBe(3);
        expect(active()).toBe('3');
        store.page = 12;
        flushSync();
        expect(active()).toBe('12');
    });

    it('bind:currentPage 重置为 undefined 后回到第 1 页并可继续翻页', async () => {
        const { store } = setupModes('currentPage', 'bind', 5);
        store.page = undefined;
        flushSync();
        expect(active()).toBe('1');
        await click(screen.getByRole('button', { name: pageName(2) }));
        expect(active()).toBe('2');
    });

    it('函数绑定：setter 拒绝时页码不变，接受时跟随', async () => {
        const rejected = setupModes('currentPage', 'function', 3, false);
        await click(screen.getByRole('button', { name: pageName(2) }));
        expect(rejected.store.log).toEqual(['set 2', 'page 2', 'change 2/10']);
        expect(rejected.store.page).toBe(3);
        expect(active()).toBe('3');
        rejected.unmount();

        const accepted = setupModes('currentPage', 'function', 3, true);
        await click(screen.getByRole('button', { name: pageName(2) }));
        expect(accepted.store.page).toBe(2);
        expect(active()).toBe('2');
    });

    it('单向传值：点击在本地覆盖，父级值不变；父级再推值时以父级为准', async () => {
        const { store } = setupModes('currentPage', 'one-way', 3);
        await click(screen.getByRole('button', { name: pageName(2) }));
        expect(store.page).toBe(3);
        expect(active()).toBe('2');
        store.page = 5;
        flushSync();
        expect(active()).toBe('5');
    });

    it('total 变化时保持传入的 currentPage，即使超出末页', () => {
        const { container, store } = setup({ currentPage: 10, total: 200 });
        store.props.total = 300;
        flushSync();
        expect(getActivePage(container)).toHaveTextContent(/^10$/);
        store.props.total = 50;
        flushSync();
        expect(getActivePage(container)).toBeNull();
        expect(getPageItems(container)).toHaveLength(5 + 2);
        expect(screen.getByRole('button', { name: zh_CN.Pagination.prev })).toBeEnabled();
        expect(screen.getByRole('button', { name: zh_CN.Pagination.next })).toBeEnabled();
    });

    it('未传 currentPage 时 total 变化回到第 1 页', () => {
        const { container, store } = setup({ total: 200 });
        store.props.total = 300;
        flushSync();
        expect(getActivePage(container)).toHaveTextContent(/^1$/);
    });
});

describe('Svelte Pagination 受控值（pageSize）', () => {
    const selection = () => getSelectionText()?.textContent;
    const active = () => document.querySelector(`.${prefix}-item-active`)?.textContent?.trim();

    it('不传：切换器改变每页条数并重算页码', async () => {
        const { store } = setupModes('pageSize', 'uncontrolled');
        await chooseSize('每页条数：20');
        await waitFor(() => expect(selection()).toBe('每页条数：20'));
        // page 5 of 10 per page starts at item 41, which is on page 3 of 20 per page
        expect(active()).toBe('3');
        expect(store.log).toContain('size 20');
    });

    it('bind:pageSize：写回父级，保持重算后的页码；父级改成不同的值时按新值重算', async () => {
        const { store } = setupModes('pageSize', 'bind', 10);
        await chooseSize('每页条数：20');
        await waitFor(() => expect(store.size).toBe(20));
        expect(selection()).toBe('每页条数：20');
        store.size = 50;
        flushSync();
        await waitFor(() => expect(selection()).toBe('每页条数：50'));
        expect(getPageItems(document.body).filter((el) => el.getAttribute('aria-label')?.startsWith('第'))).toHaveLength(4);
    });

    it('函数绑定：setter 拒绝时显示的每页条数以父级为准', async () => {
        const { store } = setupModes('pageSize', 'function', 10, false);
        await chooseSize('每页条数：20');
        await waitFor(() => expect(store.log).toContain('set 20'));
        expect(store.size).toBe(10);
    });

    it('单向传值：切换器在本地覆盖，父级再推值时以父级为准', async () => {
        const { store } = setupModes('pageSize', 'one-way', 10);
        await chooseSize('每页条数：20');
        await waitFor(() => expect(selection()).toBe('每页条数：20'));
        expect(store.size).toBe(10);
        store.size = 100;
        flushSync();
        await waitFor(() => expect(selection()).toBe('每页条数：100'));
    });

    it('动态修改 pageSize', () => {
        const { container, store } = setup({ total: 200, showSizeChanger: true, pageSize: 10 });
        for (const [size, count] of [
            [40, 7],
            [100, 4],
            [20, 9],
        ] as const) {
            store.props.pageSize = size;
            flushSync();
            expect(getSelectionText()).toHaveTextContent(new RegExp(`^每页条数：${size}$`));
            expect(getPageItems(container)).toHaveLength(count);
        }
    });
});

describe('Svelte Pagination prevText、nextText 与语言包', () => {
    it('文字作为按钮名称', async () => {
        const store = createStore<{ prev: 'text' | 'icon' | 'none'; next: string }>({ prev: 'text', next: 'Later' });
        const { container } = render(PaginationSlots, { props: { store } });
        flushSync();
        await settle();
        expect(screen.getByRole('button', { name: 'Earlier' })).toHaveClass(`${prefix}-prev`);
        expect(screen.getByRole('button', { name: 'Later' })).toHaveClass(`${prefix}-next`);
        expect(container.querySelector(`.${prefix}-next`)).toHaveTextContent(/^Later$/);
    });

    it('字符串直接渲染并作为按钮名称，同步可用', () => {
        const { container } = render(Pagination, { props: { nextText: 'Later', prevText: 'Earlier', total: 200 } });
        expect(screen.getByRole('button', { name: 'Earlier' })).toHaveClass(`${prefix}-prev`);
        expect(container.querySelector(`.${prefix}-next`)).toHaveTextContent(/^Later$/);
        expect(screen.getByRole('button', { name: 'Later' })).toHaveClass(`${prefix}-next`);
    });

    it('空字符串的按钮名称来自语言包', () => {
        render(Pagination, { props: { nextText: '', total: 200 } });
        expect(screen.getByRole('button', { name: zh_CN.Pagination.next })).toBeInTheDocument();
    });

    it('图标内容仍以语言包命名，不传回落默认图标', async () => {
        const store = createStore<{ prev: 'text' | 'icon' | 'none'; next: string }>({ prev: 'icon', next: '' });
        render(PaginationSlots, { props: { store } });
        flushSync();
        await settle();
        const prev = screen.getByRole('button', { name: zh_CN.Pagination.prev });
        expect(prev).toHaveAttribute('aria-label', zh_CN.Pagination.prev);
        expect(prev.querySelector('svg')).not.toBeNull();
        const next = screen.getByRole('button', { name: zh_CN.Pagination.next });
        expect(next.querySelector('svg')).not.toBeNull();
        store.prev = 'none';
        flushSync();
        expect(screen.getByRole('button', { name: zh_CN.Pagination.prev }).querySelector('svg')).not.toBeNull();
    });

    it('nextText 内容由空变非空时按钮原地更新，焦点留在按钮上', async () => {
        const store = createStore<{ prev: 'text' | 'icon' | 'none'; next: string }>({ prev: 'none', next: ' ' });
        render(PaginationSlots, { props: { store } });
        flushSync();
        await settle();
        const before = screen.getByRole('button', { name: zh_CN.Pagination.next });
        before.focus();
        store.next = 'Later';
        flushSync();
        await settle();
        const after = screen.getByRole('button', { name: 'Later' });
        expect(after).toBe(before);
        expect(document.activeElement).toBe(before);
    });

    it('名称随 LocaleProvider 的语言包变化', () => {
        setup({ currentPage: 10, showQuickJumper: true, showSizeChanger: true, total: 200 }, { locale: ja_JP });
        const text = ja_JP.Pagination;
        expect(screen.getByRole('button', { name: text.prev })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: text.next })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: text.pageN.replace('${page}', '10') })).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: text.more })).toHaveLength(2);
        expect(screen.getByRole('combobox')).toHaveAccessibleName(text.pageSizeSelector);
        expect(screen.getByRole('spinbutton')).toHaveAccessibleName(text.jumpTo);
    });

    it('切换语言或每页条数后，每页条数选择器显示新的文案', async () => {
        const { store } = setup({ pageSize: 10, showSizeChanger: true, total: 200 }, { locale: zh_CN });
        store.locale = en_US;
        flushSync();
        expect(getSelectionText()).toHaveTextContent(/^Items per page: 10$/);
        store.props.pageSize = 20;
        flushSync();
        expect(getSelectionText()).toHaveTextContent(/^Items per page: 20$/);
    });

    it('键盘翻页后页码按钮保持焦点', async () => {
        const { container } = setup({ total: 200, currentPage: 10 });
        const next = screen.getByRole('button', { name: pageName(11) });
        next.focus();
        await click(next);
        expect(screen.getByRole('button', { name: pageName(11) })).toBe(next);
        expect(next).toHaveFocus();
        expect(container.querySelector(`.${prefix}-item-active`)).not.toBeNull();
    });
});

describe('Svelte Pagination 全局默认值', () => {
    it('读取 overrideDefaultProps，使用方传入值优先', () => {
        semiGlobal.config.overrideDefaultProps = { Pagination: { showTotal: true, size: 'small', total: 90 } };
        const first = setup();
        expect(first.container.querySelector(`.${prefix}-small`)).not.toBeNull();
        expect(getCounter(first.container).textContent).toBe('1/9 ');
        first.unmount();
        semiGlobal.config.overrideDefaultProps = { Pagination: { showTotal: true, currentPage: 3 } };
        const second = setup({ total: 200 });
        expect(second.container.querySelector(`.${prefix}-total`)).not.toBeNull();
        expect(getActivePage(second.container)).toHaveTextContent(/^3$/);
        second.unmount();
        const third = setup({ size: 'default', total: 30 });
        expect(third.container.querySelector(`.${prefix}-small`)).toBeNull();
        expect(getPageItems(third.container)).toHaveLength(5);
    });
});
