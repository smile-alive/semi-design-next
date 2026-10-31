/** @jsxImportSource vue */
import { KeepAlive, defineComponent, nextTick, onUpdated, shallowRef } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor, within } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { IconChevronLeft } from '@fibrae/semi-icons-vue';
import { endLeaveAnimations, render } from '@test/utils/vue';
import semiGlobal, { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import LocaleProvider from '../../locale/locale-provider.vue';
import Pagination from '../index';
import type { PaginationProps } from '../interface';
import PageModel from './fixtures/page-model.vue';
import Shorthand from './fixtures/shorthand.vue';
import SizeModel from './fixtures/size-model.vue';
import Slots from './fixtures/slots.vue';

const prefix = 'semi-page';
const defaultPageSize = 10;

const getPageItems = (container: Element) => Array.from(container.querySelectorAll<HTMLButtonElement>(`.${prefix}-item`));
const getActivePage = (container: Element) => container.querySelector(`.${prefix}-item-active`);
const pageName = (page: number) => zh_CN.Pagination.pageN.replace('${page}', String(page));
const getRestPages = () => within(document.querySelector<HTMLElement>(`.${prefix}-rest-list`) as HTMLElement).getAllByRole('button');
const getJumper = (container: Element) => container.querySelector(`.${prefix}-quickjump-input-number input`) as HTMLInputElement;
const getCounter = (container: Element) => container.querySelector(`.${prefix}-item-small`) as HTMLElement;
const getSelectionText = () => document.querySelector('.semi-select-selection-text');
const renderPagination = (props: PaginationProps = {}) => render(Pagination, { props });

// a controlled Select reports its change after the leave animation, which jsdom never ends by itself
async function chooseSize(label: string) {
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByText(label));
    endLeaveAnimations();
}

afterEach(() => {
    semiGlobal.config = {};
});

describe('Pagination', () => {
    it('total 与 pageSize', () => {
        const maxItemCount = 9;
        const getPageChild = (props: PaginationProps) => {
            const view = renderPagination(props);
            const children = (view.container.querySelector('ul') as HTMLElement).children;
            const lastPage = children[children.length - 2].textContent?.trim();
            view.unmount();
            return { length: children.length, lastPage };
        };

        expect(getPageChild({ total: 30 })).toEqual({ length: 5, lastPage: '3' });
        expect(getPageChild({ total: 70 })).toEqual({ length: maxItemCount, lastPage: '7' });
        expect(getPageChild({ total: 200 })).toEqual({ length: maxItemCount, lastPage: '20' });
        expect(getPageChild({ total: 200, pageSize: 50 })).toEqual({ length: Math.ceil(200 / 50) + 2, lastPage: '4' });
    });

    it('自定义 class 与 style', () => {
        const { container } = render(Pagination, { attrs: { class: 'test', style: { color: 'red' } } });
        const ul = container.querySelector('ul.test');
        expect(ul).not.toBeNull();
        expect(ul).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('渲染 mini pagination', () => {
        const { container } = renderPagination({ size: 'small', total: 90 });
        expect(container.querySelector(`.${prefix}-small`)).not.toBeNull();
    });

    it('showTotal 与 showSizeChanger', () => {
        const { container } = renderPagination({ showSizeChanger: true, showTotal: true, total: 200 });
        expect(container.querySelector(`.${prefix}-total`)).toHaveTextContent(/^总页数：20$/);
        expect(container.querySelector(`.${prefix}-switch`)).not.toBeNull();
    });

    it('使用 defaultCurrentPage', () => {
        const { container } = renderPagination({ defaultCurrentPage: 3, showTotal: true, total: 80 });
        expect(getActivePage(container)).toHaveTextContent(/^3$/);
        expect(getActivePage(container)).toHaveAttribute('aria-current', 'page');
        expect(container.querySelector(`.${prefix}`)?.children[4]).toHaveTextContent(/^3$/);
    });

    it('首页或末页时自动禁用上一页与下一页按钮', () => {
        const getEnds = (props: PaginationProps) => {
            const view = renderPagination(props);
            const result = [zh_CN.Pagination.prev, zh_CN.Pagination.next].map((name) => {
                const button = screen.getByRole<HTMLButtonElement>('button', { name });
                expect(button.classList.contains(`${prefix}-item-disabled`)).toBe(button.disabled);
                return button.disabled;
            });
            view.unmount();
            return result;
        };
        expect(getEnds({ total: 30 })).toEqual([true, false]);
        expect(getEnds({ total: 200, defaultCurrentPage: 20 })).toEqual([false, true]);
        expect(getEnds({ total: 9 })).toEqual([true, true]);
    });

    it('hideOnSinglePage', async () => {
        const view = renderPagination({ hideOnSinglePage: true, total: 10 });
        expect(view.container.querySelector(`.${prefix}`)).toBeNull();

        await view.rerender({ hideOnSinglePage: true, total: 11 });
        expect(view.container.querySelector(`.${prefix}`)).not.toBeNull();
    });

    it('动态修改 pageSize', async () => {
        const props = { total: 200, showSizeChanger: true, pageSize: 10 };
        const view = renderPagination(props);
        await view.rerender({ ...props, pageSize: 40 });
        expect(getSelectionText()).toHaveTextContent(/^每页条数：40$/);
        expect(getPageItems(view.container)).toHaveLength(200 / 40 + 2);
        await view.rerender({ ...props, pageSize: 100 });
        expect(getSelectionText()).toHaveTextContent(/^每页条数：100$/);
        expect(getPageItems(view.container)).toHaveLength(200 / 100 + 2);
        await view.rerender({ ...props, pageSize: 20 });
        expect(getSelectionText()).toHaveTextContent(/^每页条数：20$/);
        expect(getPageItems(view.container)).toHaveLength(9);
    });

    it('pageChange', async () => {
        const view = renderPagination({ total: 70 });
        await userEvent.click(getPageItems(view.container)[7]);
        expect(view.emitted('pageChange')).toEqual([[7]]);
        expect(getActivePage(view.container)).toHaveTextContent(/^7$/);
    });

    it('pageSizeOpts', async () => {
        renderPagination({ pageSizeOpts: [10, 20, 30], showSizeChanger: true, total: 200 });
        await userEvent.click(screen.getByRole('combobox'));
        await waitFor(() => expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['每页条数：10', '每页条数：20', '每页条数：30']));
    });

    it('非受控模式下的 change', async () => {
        const view = renderPagination({ total: 200 });
        await userEvent.click(getPageItems(view.container)[7]);
        expect(view.emitted('change')).toEqual([[20, defaultPageSize]]);
        expect(getActivePage(view.container)).toHaveTextContent(/^20$/);

        await userEvent.click(getActivePage(view.container) as Element);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.more }));
        expect(view.emitted('change')).toHaveLength(1);
        expect(getActivePage(view.container)).toHaveTextContent(/^20$/);
    });

    it('受控模式下 currentPage 与 change', async () => {
        const props = { currentPage: 3, total: 200 };
        const view = renderPagination(props);
        await userEvent.click(getPageItems(view.container)[7]);
        expect(view.emitted('change')).toEqual([[20, defaultPageSize]]);
        expect(getActivePage(view.container)).toHaveTextContent(/^3$/);
        await view.rerender({ ...props, currentPage: 4 });
        expect(getActivePage(view.container)).toHaveTextContent(/^4$/);
    });

    it('父组件改 currentPage 后，父组件的 onUpdated 读到新页码', async () => {
        const seen: (string | null | undefined)[] = [];
        const Parent = defineComponent({
            props: { page: { type: Number, required: true } },
            setup(props) {
                const host = shallowRef<HTMLElement>();
                onUpdated(() => seen.push(host.value && getActivePage(host.value)?.textContent));
                return () => (
                    <div ref={host}>
                        <Pagination total={100} currentPage={props.page} />
                    </div>
                );
            },
        });
        const view = render(Parent, { props: { page: 1 } });
        await view.rerender({ page: 3 });
        expect(seen).toEqual(['3']);
    });

    describe('快速跳转', () => {
        it('输入页码后失焦跳转，超出范围时取边界', async () => {
            const view = renderPagination({ showQuickJumper: true, total: 200 });
            const jumper = getJumper(view.container);
            await userEvent.type(jumper, '5{Tab}');
            expect(view.emitted('change')).toEqual([[5, defaultPageSize]]);
            expect(getActivePage(view.container)).toHaveTextContent(/^5$/);

            await userEvent.type(jumper, '21{Tab}');
            expect(getActivePage(view.container)).toHaveTextContent(/^20$/);

            await userEvent.type(jumper, '-1{Enter}');
            expect(getActivePage(view.container)).toHaveTextContent(/^1$/);
            expect(jumper).toHaveValue('');
        });

        // Enter passes the raw input value, and Number('') is 0
        it('没有有效数字时忽略 Enter', async () => {
            const view = renderPagination({ defaultCurrentPage: 20, showQuickJumper: true, total: 200 });
            await userEvent.type(getJumper(view.container), '{Enter}');
            expect(getActivePage(view.container)).toHaveTextContent(/^20$/);
        });

        it.each([
            ['Enter', '2.5{Enter}'],
            ['失焦', '2.5{Tab}'],
        ])('小数页码经%s跳转时取整', async (_, input) => {
            const view = renderPagination({ showQuickJumper: true, total: 200 });
            await userEvent.type(getJumper(view.container), input);
            expect(view.emitted('change')).toEqual([[2, defaultPageSize]]);
            expect(getActivePage(view.container)).toHaveTextContent(/^2$/);
        });

        it('按 Enter 跳转，清空输入框，忽略当前页', async () => {
            const view = renderPagination({ showQuickJumper: true, total: 200 });
            await userEvent.type(getJumper(view.container), '7{Enter}');
            expect(view.emitted('change')).toEqual([[7, defaultPageSize]]);
            expect(getActivePage(view.container)).toHaveTextContent(/^7$/);
            expect(getJumper(view.container)).toHaveValue('');
            await userEvent.type(getJumper(view.container), '7{Enter}');
            expect(view.emitted('change')).toHaveLength(1);
        });

        it('输入法组合中按 Enter 不跳转', async () => {
            const view = renderPagination({ showQuickJumper: true, total: 200 });
            const jumper = getJumper(view.container);
            await userEvent.type(jumper, '7');
            await fireEvent.keyDown(jumper, { key: 'Enter', isComposing: true });
            expect(view.emitted('change')).toBeUndefined();
            await fireEvent.keyDown(jumper, { key: 'Enter' });
            expect(view.emitted('change')).toEqual([[7, defaultPageSize]]);
        });

        it('只有一页、没有页或 pagination 被禁用时不可用', async () => {
            const view = renderPagination({ showQuickJumper: true, total: 10 });
            expect(view.container.querySelector(`.${prefix}-quickjump`)).toHaveClass(`${prefix}-quickjump-disabled`);
            expect(getJumper(view.container)).toBeDisabled();
            await view.rerender({ disabled: true, showQuickJumper: true, total: 200 });
            expect(getJumper(view.container)).toBeDisabled();
            await view.rerender({ showQuickJumper: true, total: 0 });
            expect(getJumper(view.container)).toBeDisabled();
            await view.rerender({ disabled: false, showQuickJumper: true, total: 200 });
            expect(getJumper(view.container)).toBeEnabled();
        });
    });

    describe('页码列表', () => {
        const getPageTexts = (container: Element) =>
            getPageItems(container)
                .slice(1, -1)
                .map((li) => li.textContent?.trim());

        it('页数超过 7 时，以当前页为中心截断', async () => {
            const view = renderPagination({ currentPage: 1, total: 200 });
            expect(getPageTexts(view.container)).toEqual(['1', '2', '3', '4', '...', '19', '20']);
            await view.rerender({ currentPage: 4, total: 200 });
            expect(getPageTexts(view.container)).toEqual(['1', '2', '3', '4', '5', '...', '20']);
            await view.rerender({ currentPage: 10, total: 200 });
            expect(getPageTexts(view.container)).toEqual(['1', '...', '9', '10', '11', '...', '20']);
            await view.rerender({ currentPage: 17, total: 200 });
            expect(getPageTexts(view.container)).toEqual(['1', '...', '16', '17', '18', '19', '20']);
            await view.rerender({ currentPage: 7, total: 70 });
            expect(getPageTexts(view.container)).toEqual(['1', '2', '3', '4', '5', '6', '7']);
        });

        it('悬停省略号时列出隐藏页码，点击后跳转到对应页', async () => {
            const view = renderPagination({ defaultCurrentPage: 10, total: 200 });
            const [left, right] = screen.getAllByRole('button', { name: zh_CN.Pagination.more });
            await userEvent.hover(left);
            await waitFor(() => expect(getRestPages().map((el) => el.textContent?.trim())).toEqual(['2', '3', '4', '5', '6', '7', '8']));
            expect(getRestPages()[0]).toHaveAccessibleName(pageName(2));
            await userEvent.unhover(left);
            await userEvent.hover(right);
            await waitFor(() => expect(screen.getByRole('button', { name: pageName(12) })).toBeInTheDocument());
            await userEvent.click(screen.getByRole('button', { name: pageName(12) }));
            expect(view.emitted('change')).toEqual([[12, defaultPageSize]]);
            expect(getActivePage(view.container)).toHaveTextContent(/^12$/);
        });

        it('隐藏页码列表按 ConfigProvider 的 direction 布局', async () => {
            render({
                render: () => <ConfigProvider direction="rtl">{() => <Pagination total={200} />}</ConfigProvider>,
            });
            await userEvent.hover(screen.getByRole('button', { name: zh_CN.Pagination.more }));
            await waitFor(() => expect(document.querySelector(`.${prefix}-rest-list`)).toHaveStyle({ direction: 'rtl' }));
        });
    });

    describe('受控与非受控', () => {
        it('currentPage 在受控与非受控之间切换', async () => {
            const view = renderPagination({ currentPage: 3, total: 200 });
            await view.rerender({ currentPage: undefined, total: 200 });
            expect(getActivePage(view.container)).toHaveTextContent(/^1$/);
            await userEvent.click(screen.getByRole('button', { name: pageName(2) }));
            expect(getActivePage(view.container)).toHaveTextContent(/^2$/);

            await view.rerender({ currentPage: 5, total: 200 });
            expect(getActivePage(view.container)).toHaveTextContent(/^5$/);
            await userEvent.click(screen.getByRole('button', { name: pageName(6) }));
            expect(view.emitted('change')?.at(-1)).toEqual([6, defaultPageSize]);
            expect(getActivePage(view.container)).toHaveTextContent(/^5$/);
        });

        it('非受控模式下 total 或 pageSize 变化时回到第 1 页', async () => {
            const view = renderPagination({ defaultCurrentPage: 5, total: 200 });
            await view.rerender({ defaultCurrentPage: 5, total: 300 });
            expect(getActivePage(view.container)).toHaveTextContent(/^1$/);

            await view.rerender({ defaultCurrentPage: 5, pageSize: 10, total: 300 });
            await view.rerender({ defaultCurrentPage: 5, pageSize: 20, total: 300 });
            expect(getActivePage(view.container)).toHaveTextContent(/^1$/);
            expect(getPageItems(view.container)).toHaveLength(9);
        });

        it('total 变化时保留用户在切换器里选的 pageSize', async () => {
            const props = { pageSize: 10, showSizeChanger: true };
            const view = renderPagination({ ...props, total: 200 });
            await chooseSize('每页条数：20');
            await waitFor(() => expect(getPageItems(view.container).at(-2)).toHaveTextContent(/^10$/));
            await view.rerender({ ...props, total: 300 });
            expect(getPageItems(view.container).at(-2)).toHaveTextContent(/^15$/);
            await view.rerender({ ...props, pageSize: 50, total: 300 });
            expect(getPageItems(view.container).at(-2)).toHaveTextContent(/^6$/);
        });

        it('total 变化时保持受控的 currentPage，即使超出末页', async () => {
            const view = renderPagination({ currentPage: 10, total: 200 });
            await view.rerender({ currentPage: 10, total: 300 });
            expect(getActivePage(view.container)).toHaveTextContent(/^10$/);
            await view.rerender({ currentPage: 10, total: 50 });
            expect(getActivePage(view.container)).toBeNull();
            expect(getPageItems(view.container)).toHaveLength(5 + 2);
            expect(screen.getByRole('button', { name: zh_CN.Pagination.prev })).toBeEnabled();
            expect(screen.getByRole('button', { name: zh_CN.Pagination.next })).toBeEnabled();
        });
    });

    describe('事件', () => {
        it('每次点击上一页或下一页时各发出一次 pageChange 与 change，禁用的一端不发出', async () => {
            const view = renderPagination({ total: 30 });
            await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.prev }));
            expect(view.emitted('change')).toBeUndefined();
            await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
            await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
            await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
            expect(view.emitted('pageChange')).toEqual([[2], [3]]);
            expect(view.emitted('change')).toEqual([
                [2, 10],
                [3, 10],
            ]);
            expect(screen.getByRole('button', { name: zh_CN.Pagination.next })).toBeDisabled();
            await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.prev }));
            expect(view.emitted('change')?.at(-1)).toEqual([2, 10]);
        });

        it('切换 pageSize 时重新计算当前页', async () => {
            const view = renderPagination({ defaultCurrentPage: 5, showSizeChanger: true, total: 200 });
            await chooseSize('每页条数：20');
            await waitFor(() => expect(view.emitted('change')).toEqual([[3, 20]]));
            expect(view.emitted('pageSizeChange')).toEqual([[20]]);
            expect(view.emitted('pageChange')).toEqual([[3]]);
            expect(getActivePage(view.container)).toHaveTextContent(/^3$/);
            expect(getPageItems(view.container).filter((el) => el.getAttribute('aria-label')?.startsWith(zh_CN.Pagination.pageN.split('${page}')[0]))).toHaveLength(6);
        });

        it('切换 pageSize 时保持受控的 currentPage，只发出通知', async () => {
            const view = renderPagination({ currentPage: 5, showSizeChanger: true, total: 200 });
            await chooseSize('每页条数：20');
            await waitFor(() => expect(view.emitted('change')).toEqual([[3, 20]]));
            expect(view.emitted('pageChange')).toEqual([[3]]);
            expect(getActivePage(view.container)).toHaveTextContent(/^5$/);
        });

        it('设置 preventPageChangeOnPageSizeChange 后，切换 pageSize 保持当前页', async () => {
            const view = renderPagination({
                defaultCurrentPage: 5,
                preventPageChangeOnPageSizeChange: true,
                showSizeChanger: true,
                total: 200,
            });
            await chooseSize('每页条数：20');
            await waitFor(() => expect(view.emitted('change')).toEqual([[5, 20]]));
            expect(view.emitted('pageChange')).toBeUndefined();
            expect(getActivePage(view.container)).toHaveTextContent(/^5$/);
        });

        it('把 pageSizeOpts 中缺少的 pageSize 按顺序插入', async () => {
            renderPagination({ pageSize: 30, pageSizeOpts: [10, 20, 40], showSizeChanger: true, total: 200 });
            await userEvent.click(screen.getByRole('combobox'));
            await waitFor(() => expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['每页条数：10', '每页条数：20', '每页条数：30', '每页条数：40']));
        });

        it('比所有选项都大的 pageSize 排在最后', async () => {
            renderPagination({ pageSize: 200, showSizeChanger: true, total: 2000 });
            await userEvent.click(screen.getByRole('combobox'));
            await waitFor(() => expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['每页条数：10', '每页条数：20', '每页条数：40', '每页条数：100', '每页条数：200']));
        });

        it('update:currentPage 先于 pageChange，update:pageSize 先于 pageSizeChange', async () => {
            const order: string[] = [];
            const events = {
                'onUpdate:currentPage': () => order.push('update:currentPage'),
                'onUpdate:pageSize': () => order.push('update:pageSize'),
                onPageChange: () => order.push('pageChange'),
                onPageSizeChange: () => order.push('pageSizeChange'),
                onChange: () => order.push('change'),
            };
            render({
                render: () => <Pagination defaultCurrentPage={5} showSizeChanger total={200} {...events} />,
            });
            await userEvent.click(screen.getByRole('button', { name: pageName(6) }));
            expect(order).toEqual(['update:currentPage', 'pageChange', 'change']);
            order.length = 0;
            await chooseSize('每页条数：20');
            await waitFor(() => expect(order).toContain('change'));
            expect(order).toEqual(['update:pageSize', 'pageSizeChange', 'update:currentPage', 'pageChange', 'change']);
        });

        it('change 不再收到快速跳转输入框冒泡的原生 change 事件', async () => {
            const onChange = vi.fn<(page: number, size: number) => void>();
            const view = render(Pagination, { props: { showQuickJumper: true, total: 200 }, attrs: { onChange } });
            await userEvent.type(getJumper(view.container), '5{Tab}');
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith(5, defaultPageSize);
        });
    });

    describe('v-model', () => {
        it('v-model:currentPage 双向：点击更新父级，父级改值后高亮跟随', async () => {
            const view = render(PageModel);
            await userEvent.click(screen.getByRole('button', { name: pageName(3) }));
            expect(screen.getByLabelText('page')).toHaveTextContent('3');
            expect(getActivePage(view.container)).toHaveTextContent(/^3$/);
            await userEvent.click(screen.getByRole('button', { name: 'jump' }));
            expect(getActivePage(view.container)).toHaveTextContent(/^12$/);
        });

        it('单向绑定 currentPage：点击后只通知，页码不自翻转', async () => {
            const view = renderPagination({ currentPage: 3, total: 200 });
            await userEvent.click(screen.getByRole('button', { name: pageName(2) }));
            expect(getActivePage(view.container)).toHaveTextContent(/^3$/);
            expect(view.emitted('update:currentPage')).toEqual([[2]]);
            expect(view.emitted('pageChange')).toEqual([[2]]);
        });

        it('v-model:pageSize 回写后保持重算后的页码', async () => {
            const view = render(SizeModel);
            await chooseSize('每页条数：20');
            await waitFor(() => expect(screen.getByLabelText('size')).toHaveTextContent('20'));
            expect(getActivePage(view.container)).toHaveTextContent(/^3$/);
            expect(view.emitted('change')).toEqual([[3, 20]]);
        });

        it('v-model:pageSize 被外部改成不同的值时回到第 1 页', async () => {
            const view = render(SizeModel);
            await chooseSize('每页条数：20');
            await waitFor(() => expect(getActivePage(view.container)).toHaveTextContent(/^3$/));
            await userEvent.click(screen.getByRole('button', { name: 'set 50' }));
            await waitFor(() => expect(getActivePage(view.container)).toHaveTextContent(/^1$/));
            expect(getPageItems(view.container)).toHaveLength(Math.ceil(200 / 50) + 2);
        });
    });

    describe('small 尺寸', () => {
        it('显示当前页 / 总页数，并可通过上一页与下一页翻页', async () => {
            const view = renderPagination({ showQuickJumper: true, size: 'small', total: 90 });
            const root = view.container.firstElementChild as HTMLElement;
            expect(root.tagName).toBe('UL');
            expect(root).toHaveClass(prefix, `${prefix}-small`);
            expect(getCounter(view.container).textContent).toBe('1/9 ');
            expect(getCounter(view.container).tagName).toBe('DIV');
            await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
            expect(getCounter(view.container).textContent).toBe('2/9 ');
            expect(view.emitted('change')).toEqual([[2, defaultPageSize]]);
            expect(view.container.querySelector(`.${prefix}-quickjump`)).not.toBeNull();
            expect(view.container.querySelector(`.${prefix}-switch`)).toBeNull();
        });

        it('设置 hoverShowPageSelect 后悬停时列出所有页码', async () => {
            const view = renderPagination({ hoverShowPageSelect: true, size: 'small', total: 90 });
            expect(getCounter(view.container).tagName).toBe('BUTTON');
            await userEvent.hover(getCounter(view.container));
            await waitFor(() => expect(screen.getByRole('button', { name: pageName(1) })).toBeInTheDocument());
            await userEvent.click(screen.getByRole('button', { name: pageName(3) }));
            expect(view.emitted('change')).toEqual([[3, defaultPageSize]]);
            expect(getCounter(view.container).textContent).toBe('3/9 ');
        });

        it('未传 pageSize 时，hoverShowPageSelect 在 total 变化后保持有效', async () => {
            const view = renderPagination({ hoverShowPageSelect: true, size: 'small', total: 90 });
            await view.rerender({ hoverShowPageSelect: true, size: 'small', total: 120 });
            await userEvent.hover(getCounter(view.container));
            await waitFor(() => expect(screen.getByRole('button', { name: pageName(1) })).toBeInTheDocument());
            expect(getCounter(view.container).textContent).toBe('1/12 ');
        });

        it('只有一页时隐藏，禁用时标记全部禁用', async () => {
            const view = renderPagination({ hideOnSinglePage: true, size: 'small', total: 10 });
            expect(view.container.querySelector('ul')).toBeNull();
            await view.rerender({ disabled: true, size: 'small', total: 90 });
            expect(view.container.firstElementChild).toHaveClass(`${prefix}-disabled`);
            expect(getCounter(view.container)).toHaveClass(`${prefix}-item-all-disabled`);
        });

        it('showSizeChanger 在 small 下不生效：单页仍隐藏且不警告', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const { container } = renderPagination({
                hideOnSinglePage: true,
                showSizeChanger: true,
                size: 'small',
                total: 5,
            });
            expect(container.querySelector('ul')).toBeNull();
            expect(warn).not.toHaveBeenCalled();
        });
    });

    it('设置 showSizeChanger 时，只有一页也保持显示并给出警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { container } = renderPagination({ hideOnSinglePage: true, showSizeChanger: true, total: 10 });
        expect(container.querySelector(`.${prefix}-switch`)).not.toBeNull();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('[Semi Pagination]'));
    });

    it('禁用所有页码与尺寸切换器', async () => {
        const view = renderPagination({ defaultCurrentPage: 5, disabled: true, showSizeChanger: true, total: 200 });
        expect(view.container.querySelector('ul')).toHaveClass(`${prefix}-disabled`);
        expect(getActivePage(view.container)).toHaveClass(`${prefix}-item-all-disabled-active`);
        expect(getPageItems(view.container).every((button) => button.disabled)).toBe(true);
        await userEvent.click(screen.getByRole('button', { name: pageName(6) }));
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
        expect(view.emitted('change')).toBeUndefined();
        expect(view.container.querySelector('.semi-select')).toHaveClass('semi-select-disabled');
        await userEvent.hover(screen.getAllByRole('button', { name: zh_CN.Pagination.more })[0]);
        expect(document.querySelector(`.${prefix}-rest-list`)).toBeNull();
    });

    describe('attrs 与根元素', () => {
        it.each<[string, PaginationProps]>([
            ['default', { total: 200 }],
            ['small', { size: 'small', total: 200 }],
        ])('%s 尺寸下 id、aria-*、data-*、class、style 与原生 click 都落到根 ul', async (_, props) => {
            const onClick = vi.fn<(event: MouseEvent) => void>();
            const view = render(Pagination, {
                props,
                attrs: {
                    id: 'pager',
                    'aria-label': 'Pages',
                    'data-foo': 'bar',
                    class: 'mine',
                    style: { color: 'red' },
                    onClick,
                },
            });
            const root = view.container.querySelector('ul') as HTMLElement;
            expect(view.container.querySelectorAll('[id="pager"]')).toHaveLength(1);
            expect(root).toHaveAttribute('id', 'pager');
            expect(root).toHaveAttribute('aria-label', 'Pages');
            expect(root).toHaveAttribute('data-foo', 'bar');
            expect(root).toHaveClass('mine', prefix);
            expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
            expect(screen.getByRole('list', { name: 'Pages' })).toBe(root);
            await userEvent.click(root);
            expect(onClick).toHaveBeenCalledTimes(1);
        });

        it('aria-labelledby 命名根列表', () => {
            render({
                render: () => (
                    <>
                        <span id="title">Pager title</span>
                        <Pagination total={200} aria-labelledby="title" />
                    </>
                ),
            });
            expect(screen.getByRole('list', { name: 'Pager title' })).toBeInTheDocument();
        });

        it('隐藏时不产生 Vue 的多余属性警告', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const { container } = render(Pagination, {
                props: { hideOnSinglePage: true, total: 5 },
                attrs: { class: 'mine', id: 'pager' },
            });
            expect(container.querySelector('ul')).toBeNull();
            expect(warn).not.toHaveBeenCalled();
        });

        it('内部控件不接收使用方的 aria-label', () => {
            render(Pagination, {
                props: { showQuickJumper: true, showSizeChanger: true, total: 200 },
                attrs: { 'aria-label': 'Pages' },
            });
            expect(screen.getByRole('combobox')).toHaveAccessibleName(zh_CN.Pagination.pageSizeSelector);
            expect(screen.getByRole('spinbutton')).toHaveAccessibleName(zh_CN.Pagination.jumpTo);
        });

        it.each(['default', 'small'] as const)('模板 ref 的 $el 是根 ul（%s）', (size) => {
            const pager = shallowRef<{ $el: HTMLElement }>();
            const view = render({ render: () => <Pagination ref={pager} total={200} size={size} /> });
            expect(pager.value?.$el.tagName).toBe('UL');
            expect(pager.value?.$el).toBe(view.container.querySelector('ul'));
        });
    });

    describe('语义', () => {
        it('是由原生按钮组成的列表，并标记当前页', () => {
            renderPagination({
                defaultCurrentPage: 10,
                showQuickJumper: true,
                showSizeChanger: true,
                showTotal: true,
                total: 200,
            });
            const list = screen.getByRole('list');
            expect([...list.children].every((child) => child.tagName === 'LI')).toBe(true);
            expect(screen.getByRole('button', { name: pageName(10) })).toHaveAttribute('aria-current', 'page');
            expect(screen.getByRole('button', { name: pageName(9) })).not.toHaveAttribute('aria-current');
            expect(screen.getAllByRole('button', { name: zh_CN.Pagination.more })).toHaveLength(2);
            expect(screen.getByRole('spinbutton', { name: zh_CN.Pagination.jumpTo })).toBeInTheDocument();
        });

        it('prevText 与 nextText 的文字作为按钮名称', () => {
            const { container } = render(Pagination, {
                props: { total: 200 },
                slots: { prevText: () => 'Earlier', nextText: () => 'Later' },
            });
            expect(screen.getByRole('button', { name: 'Earlier' })).toHaveClass(`${prefix}-prev`);
            expect(screen.getByRole('button', { name: 'Later' })).toHaveClass(`${prefix}-next`);
            expect(container.querySelector(`.${prefix}-next`)).toHaveTextContent(/^Later$/);
        });

        it('prevText 为图标时仍以语言包命名，空内容回落默认图标', () => {
            render(Slots);
            const [iconPrev, emptyPrev] = screen.getAllByRole('button', { name: zh_CN.Pagination.prev });
            expect(iconPrev).toHaveAttribute('aria-label', zh_CN.Pagination.prev);
            expect(iconPrev.querySelector('svg')).not.toBeNull();
            expect(emptyPrev).toHaveAttribute('aria-label', zh_CN.Pagination.prev);
            expect(emptyPrev.querySelector('svg')).not.toBeNull();
            expect(screen.getByRole('button', { name: 'Later' })).toHaveClass(`${prefix}-next`);
            expect(screen.getByRole('button', { name: zh_CN.Pagination.next }).querySelector('svg')).not.toBeNull();
        });

        it('prevText 与 nextText 每次渲染各只调用一次', () => {
            const prevText = vi.fn<() => string>(() => 'Earlier');
            const nextText = vi.fn<() => string>(() => 'Later');
            render(Pagination, { props: { total: 200 }, slots: { prevText, nextText } });
            expect(screen.getByRole('button', { name: 'Earlier' })).toBeInTheDocument();
            expect(prevText).toHaveBeenCalledTimes(1);
            expect(nextText).toHaveBeenCalledTimes(1);
        });

        it('nextText 插槽内容由空变非空时按钮原地更新，焦点留在按钮上', async () => {
            const label = shallowRef('');
            render({ render: () => <Pagination total={200}>{{ nextText: () => label.value }}</Pagination> });
            const before = screen.getByRole('button', { name: zh_CN.Pagination.next });
            before.focus();
            label.value = 'Later';
            await nextTick();
            const after = screen.getByRole('button', { name: 'Later' });
            expect(after).toBe(before);
            expect(document.activeElement).toBe(before);
        });

        it('prevText 为图标节点时按钮名称取语言包', () => {
            render(Pagination, {
                props: { total: 200 },
                slots: { prevText: () => <IconChevronLeft /> },
            });
            expect(screen.getByRole('button', { name: zh_CN.Pagination.prev })).toBeInTheDocument();
        });

        it.each([
            ['svg', () => <svg />],
            ['元素', () => <span>Prev</span>],
        ])('prevText 为%s时按钮名称取语言包', (_name, content) => {
            render(Pagination, { props: { total: 200 }, slots: { prevText: () => content() } });
            expect(screen.getByRole('button', { name: zh_CN.Pagination.prev })).toBeInTheDocument();
        });

        it('名称随 ja_JP 语言包变化', () => {
            render({
                render: () => <LocaleProvider locale={ja_JP}>{() => <Pagination defaultCurrentPage={10} showQuickJumper showSizeChanger total={200} />}</LocaleProvider>,
            });
            const text = ja_JP.Pagination;
            expect(screen.getByRole('button', { name: text.prev })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: text.next })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: text.pageN.replace('${page}', '10') })).toBeInTheDocument();
            expect(screen.getAllByRole('button', { name: text.more })).toHaveLength(2);
            expect(screen.getByRole('combobox')).toHaveAccessibleName(text.pageSizeSelector);
            expect(screen.getByRole('spinbutton')).toHaveAccessibleName(text.jumpTo);
        });
    });

    describe('语言与选项文案', () => {
        it('使用 LocaleProvider 提供的语言', () => {
            const { container } = render({
                render: () => <LocaleProvider locale={en_US}>{() => <Pagination showQuickJumper showSizeChanger showTotal total={200} />}</LocaleProvider>,
            });
            expect(container.querySelector(`.${prefix}-total`)).toHaveTextContent(/^Total pages: 20$/);
            expect(getSelectionText()).toHaveTextContent(/^Items per page: 10$/);
            expect(container.querySelector(`.${prefix}-quickjump`)).toHaveTextContent(/^Jump to page$/);
        });

        it('切换语言或每页条数后，每页条数选择器显示新的文案，选项内没有 span', async () => {
            const locale = shallowRef(zh_CN);
            const pageSize = shallowRef(10);
            render({
                render: () => <LocaleProvider locale={locale.value}>{() => <Pagination pageSize={pageSize.value} showSizeChanger total={200} />}</LocaleProvider>,
            });
            locale.value = en_US;
            await nextTick();
            expect(getSelectionText()).toHaveTextContent(/^Items per page: 10$/);
            pageSize.value = 20;
            await nextTick();
            expect(getSelectionText()).toHaveTextContent(/^Items per page: 20$/);
            await userEvent.click(screen.getByRole('combobox'));
            const option = await screen.findByRole('option', { name: 'Items per page: 20' });
            expect(option.querySelector('span span')).toBeNull();
            expect(option.textContent).toBe('Items per page: 20');
        });
    });

    describe('默认值', () => {
        it('读取 semiGlobal overrideDefaultProps 中的默认值', () => {
            semiGlobal.config.overrideDefaultProps = { Pagination: { showTotal: true, defaultCurrentPage: 3 } };
            const { container } = renderPagination({ total: 200 });
            expect(container.querySelector(`.${prefix}-total`)).not.toBeNull();
            expect(getActivePage(container)).toHaveTextContent(/^3$/);
        });

        it('全局 InputNumber 默认值不给快速跳转框加清除按钮', async () => {
            semiGlobal.config.overrideDefaultProps = { InputNumber: { showClear: true } };
            const { container } = renderPagination({ showQuickJumper: true, total: 200 });
            await userEvent.type(getJumper(container), '3');
            expect(container.querySelector('.semi-input-clearbtn')).toBeNull();
        });

        it('读取 app 注入的全局默认值，size 的全局值生效，使用方传入值优先', () => {
            const semi = new SemiGlobal();
            semi.config.overrideDefaultProps = { Pagination: { size: 'small', total: 90 } };
            const first = render(Pagination, { global: { provide: { [semiGlobalKey]: semi } } });
            expect(first.container.querySelector(`.${prefix}-small`)).not.toBeNull();
            expect(getCounter(first.container).textContent).toBe('1/9 ');
            first.unmount();
            const second = render(Pagination, {
                props: { size: 'default', total: 30 },
                global: { provide: { [semiGlobalKey]: semi } },
            });
            expect(second.container.querySelector(`.${prefix}-small`)).toBeNull();
            expect(getPageItems(second.container)).toHaveLength(5);
        });

        it('模板里的布尔简写等于 true', () => {
            const view = render(Shorthand);
            expect(view.container.querySelector(`.${prefix}-total`)).not.toBeNull();
            expect(view.container.querySelector('ul')).toHaveClass(`${prefix}-disabled`);
            view.unmount();
            const single = render(Shorthand, { props: { total: 5 } });
            expect(single.container.querySelector('ul')).toBeNull();
        });
    });

    it('键盘翻页后，页码按钮保持焦点（页码移动不重挂载按钮）', async () => {
        renderPagination({ total: 200, defaultCurrentPage: 10 });
        const next = screen.getByRole('button', { name: pageName(11) });
        next.focus();
        await userEvent.keyboard('{Enter}');
        expect(screen.getByRole('button', { name: pageName(11) })).toBe(next);
        expect(next).toHaveFocus();
    });

    it('KeepAlive 切走再切回后页码与悬停弹层保持可用', async () => {
        const shown = shallowRef(true);
        const view = render(() => (
            <KeepAlive>
                {{
                    default: () => [shown.value ? <Pagination defaultCurrentPage={4} total={200} /> : <p>other</p>],
                }}
            </KeepAlive>
        ));
        await userEvent.click(screen.getByRole('button', { name: pageName(5) }));
        shown.value = false;
        await nextTick();
        shown.value = true;
        await nextTick();
        expect(getActivePage(view.container)).toHaveTextContent(/^5$/);
        await userEvent.hover(screen.getAllByRole('button', { name: zh_CN.Pagination.more })[1]);
        await waitFor(() => expect(document.querySelector(`.${prefix}-rest-list`)).not.toBeNull());
    });
});
