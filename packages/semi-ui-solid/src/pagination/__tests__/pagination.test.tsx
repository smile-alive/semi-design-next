import { createSignal, onMount } from 'solid-js';
import { render, screen, waitFor, within } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import Pagination, { type PaginationProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import LocaleProvider from '../../locale/locale-provider';
import Tooltip from '../../tooltip';

const defaultPageSize = 10;
const prefixCls = `${BASE_CLASS_PREFIX}-page`;

const getPageItems = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLButtonElement>(`.${prefixCls}-item`));
const getActivePage = (container: HTMLElement) => container.querySelector(`.${prefixCls}-item-active`);
const pageName = (page: number) => zh_CN.Pagination.pageN.replace('${page}', String(page));
const getRestPages = () => within(document.querySelector(`.${prefixCls}-rest-list`) as HTMLElement).getAllByRole('button');
const getJumper = (container: HTMLElement) => container.querySelector(`.${prefixCls}-quickjump-input-number input`) as HTMLInputElement;
const getSelectionText = (container: HTMLElement) => container.querySelector(`.${BASE_CLASS_PREFIX}-select-selection-text`);

/** Renders with props that can be replaced as a whole later, like a rerender */
function renderPagination(initial: PaginationProps) {
    const [props, setProps] = createSignal(initial);
    const result = render(() => <Pagination {...props()} />);
    return { ...result, setProps };
}

/** A parent's onMount replaces the props before the pager's effects first run */
function renderChangedOnMount(initial: PaginationProps, mounted: PaginationProps) {
    const [props, setProps] = createSignal(initial);
    function Demo() {
        onMount(() => setProps(mounted));
        return <Pagination {...props()} />;
    }
    return render(() => <Demo />);
}

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
});

describe('Pagination', () => {
    // Checks the number of rendered page items and the last page number
    it('Pagination total 与 pageSize', () => {
        const maxItemCount = 9;

        const getPageChild = (props: PaginationProps) => {
            const { container, unmount } = render(() => <Pagination {...props} />);
            const children = (container.querySelector('ul') as HTMLUListElement).children;
            const lastPage = children[children.length - 2].textContent;
            unmount();
            return { length: children.length, lastPage };
        };

        expect(getPageChild({ total: 30 })).toEqual({ length: 5, lastPage: '3' });
        expect(getPageChild({ total: 70 })).toEqual({ length: maxItemCount, lastPage: '7' });
        expect(getPageChild({ total: 200 })).toEqual({ length: maxItemCount, lastPage: '20' });
        expect(getPageChild({ total: 200, pageSize: 50 })).toEqual({ length: Math.ceil(200 / 50) + 2, lastPage: '4' });
    });

    it('Pagination 使用自定义 class 与 style', () => {
        const { container } = render(() => <Pagination class="test" style={{ color: 'red' }} />);
        const ul = container.querySelector('ul.test');
        expect(ul).not.toBeNull();
        expect(ul).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('渲染 mini pagination', () => {
        const { container } = render(() => <Pagination size="small" total={90} />);
        expect(container.querySelector(`.${prefixCls}-small`)).not.toBeNull();
    });

    it('Pagination showTotal 与 showSizeChanger', () => {
        const { container } = render(() => <Pagination showSizeChanger showTotal total={80} />);
        expect(container.querySelector(`.${prefixCls}-total`)).not.toBeNull();
        expect(container.querySelector(`.${prefixCls}-switch`)).not.toBeNull();
    });

    it('Pagination 使用 defaultCurrentPage', () => {
        const { container } = render(() => <Pagination defaultCurrentPage={3} showTotal total={80} />);
        expect(getActivePage(container)).toHaveTextContent(/^3$/);
        expect(getActivePage(container)).toHaveAttribute('aria-current', 'page');
        expect(container.querySelector(`.${prefixCls}`)?.children[4]).toHaveTextContent(/^3$/);
    });

    it('首页或末页时自动禁用上一页与下一页按钮', () => {
        const getEnds = (props: PaginationProps) => {
            const { unmount } = render(() => <Pagination {...props} />);
            const result = [zh_CN.Pagination.prev, zh_CN.Pagination.next].map((name) => {
                const button = screen.getByRole<HTMLButtonElement>('button', { name });
                expect(button.classList.contains(`${prefixCls}-item-disabled`)).toBe(button.disabled);
                return button.disabled;
            });
            unmount();
            return result;
        };
        expect(getEnds({ total: 30 })).toEqual([true, false]);
        expect(getEnds({ total: 200, defaultCurrentPage: 20 })).toEqual([false, true]);
        expect(getEnds({ total: 9 })).toEqual([true, true]);
    });

    it('hideOnSinglePage', () => {
        const { container, setProps } = renderPagination({ hideOnSinglePage: true, total: 10 });
        expect(container.querySelector(`.${prefixCls}`)).toBeNull();

        setProps({ hideOnSinglePage: true, total: 11 });
        expect(container.querySelector(`.${prefixCls}`)).not.toBeNull();
    });

    it('nextText 与 prevText', () => {
        const { container } = render(() => <Pagination nextText="next" prevText="prev" total={200} />);
        expect(container.querySelector(`.${prefixCls}-next`)).toHaveTextContent(/^next$/);
        expect(container.querySelector(`.${prefixCls}-prev`)).toHaveTextContent(/^prev$/);
    });

    it('showTotal 与 showSizeChanger', () => {
        const { container } = render(() => <Pagination showSizeChanger showTotal total={200} />);
        expect(container.querySelector(`.${prefixCls}-total`)).toHaveTextContent(/^总页数：20$/);
        expect(container.querySelector(`.${prefixCls}-switch`)).not.toBeNull();
    });

    it('动态修改 pageSize', () => {
        const props = { total: 200, showSizeChanger: true, pageSize: 10 };
        const { container, setProps } = renderPagination(props);
        setProps({ ...props, pageSize: 40 });
        expect(getSelectionText(container)).toHaveTextContent(/^每页条数：40$/);
        expect(getPageItems(container)).toHaveLength(200 / 40 + 2);
        setProps({ ...props, pageSize: 100 });
        expect(getSelectionText(container)).toHaveTextContent(/^每页条数：100$/);
        expect(getPageItems(container)).toHaveLength(200 / 100 + 2);
        setProps({ ...props, pageSize: 20 });
        expect(getSelectionText(container)).toHaveTextContent(/^每页条数：20$/);
        expect(getPageItems(container)).toHaveLength(9);
    });

    it('整体替换 props 时保留列表节点与焦点', () => {
        const props = { total: 200, pageSize: 10 };
        const { container, setProps } = renderPagination(props);
        const list = container.querySelector('ul');
        const page = getPageItems(container)[1];
        page.focus();
        setProps({ ...props, pageSize: 20 });
        expect(container.querySelector('ul')).toBe(list);
        expect(page).toHaveFocus();
    });

    it('onPageChange', async () => {
        const targetPage = 7;
        const spyOnPageChange = vi.fn<NonNullable<PaginationProps['onPageChange']>>();
        const { container } = render(() => <Pagination total={70} onPageChange={spyOnPageChange} />);
        await userEvent.click(getPageItems(container)[7]);
        expect(spyOnPageChange).toHaveBeenCalledTimes(1);
        expect(spyOnPageChange).toHaveBeenCalledWith(targetPage);
        expect(getActivePage(container)).toHaveTextContent(/^7$/);
    });

    it('回调显式为 null 时翻页照常进行', async () => {
        const { container } = render(() => <Pagination total={70} onChange={null as never} onPageChange={null as never} onPageSizeChange={null as never} />);
        await userEvent.click(getPageItems(container)[7]);
        expect(getActivePage(container)).toHaveTextContent(/^7$/);
    });

    it('pageSizeOpts', async () => {
        render(() => <Pagination pageSizeOpts={[10, 20, 30]} showSizeChanger total={200} />);
        await userEvent.click(screen.getByRole('combobox'));
        await waitFor(() => expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['每页条数：10', '每页条数：20', '每页条数：30']));
    });

    it('非受控模式下 onChange', async () => {
        const targetPage = 20;
        const spyOnChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
        const { container } = render(() => <Pagination total={200} onChange={spyOnChange} />);
        await userEvent.click(getPageItems(container)[7]);
        expect(spyOnChange).toHaveBeenCalledWith(targetPage, defaultPageSize);
        expect(getActivePage(container)).toHaveTextContent(/^20$/);

        await userEvent.click(getActivePage(container) as Element);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.more }));
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(getActivePage(container)).toHaveTextContent(/^20$/);
    });

    it('受控模式下 currentPage 与 onChange', async () => {
        const spyOnChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
        const props = { currentPage: 3, total: 200, onChange: spyOnChange };
        const { container, setProps } = renderPagination(props);
        await userEvent.click(getPageItems(container)[7]);
        expect(spyOnChange).toHaveBeenCalledWith(20, defaultPageSize);
        expect(getActivePage(container)).toHaveTextContent(/^3$/);
        setProps({ ...props, currentPage: 4 });
        expect(getActivePage(container)).toHaveTextContent(/^4$/);
    });

    it('showQuickJumper', async () => {
        const spyOnChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
        const props = { total: 200, onChange: spyOnChange, showQuickJumper: true };
        const quickJumpPage = 5;
        const { container } = render(() => <Pagination {...props} />);
        const jumper = container.querySelector(`.${prefixCls} .${prefixCls}-quickjump-input-number.${BASE_CLASS_PREFIX}-input-number input`) as HTMLInputElement;
        await userEvent.type(jumper, String(quickJumpPage));
        jumper.blur();
        expect(spyOnChange).toHaveBeenCalledWith(quickJumpPage, defaultPageSize);
        expect(getActivePage(container)).toHaveTextContent(new RegExp(`^${quickJumpPage}$`));

        await userEvent.type(jumper, String(props.total / 10 + 1));
        jumper.blur();
        expect(getActivePage(container)).toHaveTextContent(new RegExp(`^${props.total / 10}$`));

        await userEvent.type(jumper, '-1{Enter}');
        expect(getActivePage(container)).toHaveTextContent(/^1$/);
        expect(jumper).toHaveValue('');
    });

    // Enter passes the raw input value, and Number('') is 0: an empty jumper (also after a jump, when typed letters
    // are rejected) used to go to page 1, while blur on the same empty input is a no-op
    it('showQuickJumper 在没有有效数字时忽略 Enter', async () => {
        const { container } = render(() => <Pagination defaultCurrentPage={20} showQuickJumper total={200} />);
        await userEvent.type(getJumper(container), '{Enter}');
        expect(getActivePage(container)).toHaveTextContent(/^20$/);
    });

    describe('页码列表', () => {
        const getPageTexts = (container: HTMLElement) =>
            getPageItems(container)
                .slice(1, -1)
                .map((li) => li.textContent);

        it('页数超过 7 时，以当前页为中心截断', () => {
            const { container, setProps } = renderPagination({ currentPage: 1, total: 200 });
            expect(getPageTexts(container)).toEqual(['1', '2', '3', '4', '...', '19', '20']);
            setProps({ currentPage: 4, total: 200 });
            expect(getPageTexts(container)).toEqual(['1', '2', '3', '4', '5', '...', '20']);
            setProps({ currentPage: 10, total: 200 });
            expect(getPageTexts(container)).toEqual(['1', '...', '9', '10', '11', '...', '20']);
            setProps({ currentPage: 17, total: 200 });
            expect(getPageTexts(container)).toEqual(['1', '...', '16', '17', '18', '19', '20']);
            setProps({ currentPage: 7, total: 70 });
            expect(getPageTexts(container)).toEqual(['1', '2', '3', '4', '5', '6', '7']);
        });

        it('悬停省略号时列出隐藏页码，点击后跳转到对应页', async () => {
            const onChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
            const { container } = render(() => <Pagination defaultCurrentPage={10} total={200} onChange={onChange} />);
            const [left, right] = screen.getAllByRole('button', { name: zh_CN.Pagination.more });
            await userEvent.hover(left);
            await waitFor(() => expect(getRestPages().map((el) => el.textContent)).toEqual(['2', '3', '4', '5', '6', '7', '8']));
            expect(getRestPages()[0]).toHaveAccessibleName(pageName(2));
            await userEvent.unhover(left);
            await userEvent.hover(right);
            await waitFor(() => expect(screen.getByRole('button', { name: pageName(12) })).toBeInTheDocument());
            await userEvent.click(screen.getByRole('button', { name: pageName(12) }));
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith(12, defaultPageSize);
            expect(getActivePage(container)).toHaveTextContent(/^12$/);
        });

        it('隐藏页码列表按 ConfigProvider 的 direction 布局', async () => {
            render(() => (
                <ConfigProvider direction="rtl">
                    <Pagination total={200} />
                </ConfigProvider>
            ));
            await userEvent.hover(screen.getByRole('button', { name: zh_CN.Pagination.more }));
            await waitFor(() => expect(document.querySelector(`.${prefixCls}-rest-list`)).toHaveStyle({ direction: 'rtl' }));
        });
    });

    describe('受控与非受控', () => {
        it('currentPage 在受控与非受控之间切换', async () => {
            const onChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
            const { container, setProps } = renderPagination({ currentPage: 3, total: 200, onChange });
            setProps({ total: 200, onChange });
            expect(getActivePage(container)).toHaveTextContent(/^1$/);
            await userEvent.click(screen.getByRole('button', { name: pageName(2) }));
            expect(getActivePage(container)).toHaveTextContent(/^2$/);

            setProps({ currentPage: 5, total: 200, onChange });
            expect(getActivePage(container)).toHaveTextContent(/^5$/);
            await userEvent.click(screen.getByRole('button', { name: pageName(6) }));
            expect(onChange).toHaveBeenLastCalledWith(6, defaultPageSize);
            expect(getActivePage(container)).toHaveTextContent(/^5$/);
        });

        it('非受控模式下 total 或 pageSize 变化时回到第 1 页', () => {
            const { container, setProps } = renderPagination({ defaultCurrentPage: 5, total: 200 });
            setProps({ defaultCurrentPage: 5, total: 300 });
            expect(getActivePage(container)).toHaveTextContent(/^1$/);

            setProps({ defaultCurrentPage: 5, pageSize: 10, total: 300 });
            setProps({ defaultCurrentPage: 5, pageSize: 20, total: 300 });
            expect(getActivePage(container)).toHaveTextContent(/^1$/);
            expect(getPageItems(container)).toHaveLength(9);
        });

        it('父组件挂载时就改了 currentPage，显示新的当前页', () => {
            const { container } = renderChangedOnMount({ currentPage: 1, total: 200 }, { currentPage: 3, total: 200 });
            expect(getActivePage(container)).toHaveTextContent(/^3$/);
        });

        it('父组件挂载时就改了 total，非受控时回到第 1 页', () => {
            const { container } = renderChangedOnMount({ defaultCurrentPage: 5, total: 200 }, { defaultCurrentPage: 5, total: 300 });
            expect(getActivePage(container)).toHaveTextContent(/^1$/);
        });

        it('父组件挂载时就改了 pageSize，按新的每页条数分页', () => {
            const { container } = renderChangedOnMount({ pageSize: 10, total: 200 }, { pageSize: 20, total: 200 });
            expect(getPageItems(container).at(-2)).toHaveTextContent(/^10$/);
        });

        it('total 变化时保留用户在切换器里选的 pageSize', async () => {
            const props = { pageSize: 10, showSizeChanger: true };
            const { container, setProps } = renderPagination({ ...props, total: 200 });
            await userEvent.click(screen.getByRole('combobox'));
            await userEvent.click(await screen.findByText('每页条数：20'));
            expect(getPageItems(container).at(-2)).toHaveTextContent(/^10$/);
            setProps({ ...props, total: 300 });
            expect(getPageItems(container).at(-2)).toHaveTextContent(/^15$/);
            setProps({ ...props, pageSize: 50, total: 300 });
            expect(getPageItems(container).at(-2)).toHaveTextContent(/^6$/);
        });

        it('整体替换 props 而 currentPage、total 未变时，保持非受控的当前页', async () => {
            const { container, setProps } = renderPagination({ total: 200 });
            await userEvent.click(screen.getByRole('button', { name: pageName(3) }));
            setProps({ showTotal: true, total: 200 });
            expect(getActivePage(container)).toHaveTextContent(/^3$/);
        });

        it('total 变化时保持受控的 currentPage，即使超出末页', () => {
            const { container, setProps } = renderPagination({ currentPage: 10, total: 200 });
            setProps({ currentPage: 10, total: 300 });
            expect(getActivePage(container)).toHaveTextContent(/^10$/);
            setProps({ currentPage: 10, total: 50 });
            expect(getActivePage(container)).toBeNull();
            expect(getPageItems(container)).toHaveLength(5 + 2);
            expect(screen.getByRole('button', { name: zh_CN.Pagination.prev })).toBeEnabled();
            expect(screen.getByRole('button', { name: zh_CN.Pagination.next })).toBeEnabled();
        });
    });

    describe('回调', () => {
        it('每次点击上一页或下一页时各调用一次 onPageChange 与 onChange，禁用的一端不调用', async () => {
            const onPageChange = vi.fn<NonNullable<PaginationProps['onPageChange']>>();
            const onChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
            render(() => <Pagination total={30} onChange={onChange} onPageChange={onPageChange} />);
            await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.prev }));
            expect(onChange).not.toHaveBeenCalled();
            await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
            await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
            await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
            expect(onPageChange.mock.calls).toEqual([[2], [3]]);
            expect(onChange.mock.calls).toEqual([
                [2, 10],
                [3, 10],
            ]);
            expect(screen.getByRole('button', { name: zh_CN.Pagination.next })).toBeDisabled();
            await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.prev }));
            expect(onChange).toHaveBeenLastCalledWith(2, 10);
        });

        it('切换 pageSize 时重新计算当前页', async () => {
            const onPageChange = vi.fn<NonNullable<PaginationProps['onPageChange']>>();
            const onPageSizeChange = vi.fn<NonNullable<PaginationProps['onPageSizeChange']>>();
            const onChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
            const { container } = render(() => <Pagination defaultCurrentPage={5} showSizeChanger total={200} onChange={onChange} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />);
            await userEvent.click(screen.getByRole('combobox'));
            await userEvent.click(await screen.findByText('每页条数：20'));
            expect(onPageSizeChange.mock.calls).toEqual([[20]]);
            expect(onPageChange.mock.calls).toEqual([[3]]);
            expect(onChange.mock.calls).toEqual([[3, 20]]);
            expect(getActivePage(container)).toHaveTextContent(/^3$/);
            expect(getPageItems(container).filter((li) => li.getAttribute('aria-label')?.startsWith(zh_CN.Pagination.pageN.split('${page}')[0]))).toHaveLength(6);
        });

        it('切换 pageSize 时保持受控的 currentPage，只发出通知', async () => {
            const onPageChange = vi.fn<NonNullable<PaginationProps['onPageChange']>>();
            const onChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
            const { container } = render(() => <Pagination currentPage={5} showSizeChanger total={200} onChange={onChange} onPageChange={onPageChange} />);
            await userEvent.click(screen.getByRole('combobox'));
            await userEvent.click(await screen.findByText('每页条数：20'));
            expect(onChange.mock.calls).toEqual([[3, 20]]);
            expect(onPageChange.mock.calls).toEqual([[3]]);
            expect(getActivePage(container)).toHaveTextContent(/^5$/);
        });

        it('设置 preventPageChangeOnPageSizeChange 后，切换 pageSize 保持当前页', async () => {
            const onPageChange = vi.fn<NonNullable<PaginationProps['onPageChange']>>();
            const onChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
            const { container } = render(() => <Pagination defaultCurrentPage={5} preventPageChangeOnPageSizeChange showSizeChanger total={200} onChange={onChange} onPageChange={onPageChange} />);
            await userEvent.click(screen.getByRole('combobox'));
            await userEvent.click(await screen.findByText('每页条数：20'));
            expect(onPageChange).not.toHaveBeenCalled();
            expect(onChange.mock.calls).toEqual([[5, 20]]);
            expect(getActivePage(container)).toHaveTextContent(/^5$/);
        });

        it('把 pageSizeOpts 中缺少的 pageSize 按顺序插入', async () => {
            render(() => <Pagination pageSize={30} pageSizeOpts={[10, 20, 40]} showSizeChanger total={200} />);
            await userEvent.click(screen.getByRole('combobox'));
            await waitFor(() => expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['每页条数：10', '每页条数：20', '每页条数：30', '每页条数：40']));
        });
    });

    // findIndex(el > pageSize) is -1 for a pageSize above every option, and splicing at -1 put it before the last one
    it('比所有选项都大的 pageSize 排在最后', async () => {
        render(() => <Pagination pageSize={200} showSizeChanger total={2000} />);
        await userEvent.click(screen.getByRole('combobox'));
        await waitFor(() => expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['每页条数：10', '每页条数：20', '每页条数：40', '每页条数：100', '每页条数：200']));
    });

    // the page numbers were rebuilt from props.pageSize, which is undefined when only state holds the page size, and
    // Array.from({ length: Infinity }) threw
    it('未传 pageSize 时，small 模式的 hoverShowPageSelect 在 total 变化后保持有效', async () => {
        const { container, setProps } = renderPagination({ hoverShowPageSelect: true, size: 'small', total: 90 });
        setProps({ hoverShowPageSelect: true, size: 'small', total: 120 });
        await userEvent.hover(container.querySelector(`.${prefixCls}-item-small`) as Element);
        await waitFor(() => expect(screen.getByRole('button', { name: pageName(1) })).toBeInTheDocument());
        expect(container.querySelector(`.${prefixCls}-item-small`)?.textContent).toBe('1/12 ');
    });

    describe('快速跳转', () => {
        it.each([
            ['Enter', '2.5{Enter}'],
            ['失焦', '2.5{Tab}'],
        ])('小数页码经%s跳转时取整', async (_, input) => {
            const onChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
            const { container } = render(() => <Pagination showQuickJumper total={200} onChange={onChange} />);
            await userEvent.type(getJumper(container), input);
            expect(onChange.mock.calls).toEqual([[2, 10]]);
            expect(getActivePage(container)).toHaveTextContent(/^2$/);
        });

        it('按 Enter 跳转，清空输入框，忽略当前页', async () => {
            const onChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
            const { container } = render(() => <Pagination showQuickJumper total={200} onChange={onChange} />);
            await userEvent.type(getJumper(container), '7{Enter}');
            expect(onChange.mock.calls).toEqual([[7, 10]]);
            expect(getActivePage(container)).toHaveTextContent(/^7$/);
            expect(getJumper(container)).toHaveValue('');
            await userEvent.type(getJumper(container), '7{Enter}');
            expect(onChange).toHaveBeenCalledTimes(1);
        });

        it('只有一页或 pagination 被禁用时，快速跳转不可用', () => {
            const { container, setProps } = renderPagination({ showQuickJumper: true, total: 10 });
            expect(container.querySelector(`.${prefixCls}-quickjump`)).toHaveClass(`${prefixCls}-quickjump-disabled`);
            expect(getJumper(container)).toBeDisabled();
            setProps({ disabled: true, showQuickJumper: true, total: 200 });
            expect(getJumper(container)).toBeDisabled();
            setProps({ showQuickJumper: true, total: 200 });
            expect(getJumper(container)).toBeEnabled();
        });
    });

    describe('small 尺寸', () => {
        const getCounter = (container: HTMLElement) => container.querySelector(`.${prefixCls}-item-small`) as HTMLElement;

        it('显示当前页 / 总页数，并可通过上一页与下一页翻页', async () => {
            const onChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
            const { container } = render(() => <Pagination showQuickJumper size="small" total={90} onChange={onChange} />);
            const root = container.firstElementChild as HTMLElement;
            expect(root.tagName).toBe('UL');
            expect(root).toHaveClass(prefixCls, `${prefixCls}-small`);
            expect(getCounter(container).textContent).toBe('1/9 ');
            expect(getCounter(container).tagName).toBe('DIV');
            await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
            expect(getCounter(container).textContent).toBe('2/9 ');
            expect(onChange).toHaveBeenCalledWith(2, 10);
            expect(container.querySelector(`.${prefixCls}-quickjump`)).not.toBeNull();
            expect(container.querySelector(`.${prefixCls}-switch`)).toBeNull();
        });

        it('设置 hoverShowPageSelect 后悬停时列出所有页码', async () => {
            const onChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
            const { container } = render(() => <Pagination hoverShowPageSelect size="small" total={90} onChange={onChange} />);
            expect(getCounter(container).tagName).toBe('BUTTON');
            await userEvent.hover(getCounter(container));
            await waitFor(() => expect(screen.getByRole('button', { name: pageName(1) })).toBeInTheDocument());
            await userEvent.click(screen.getByRole('button', { name: pageName(3) }));
            expect(onChange).toHaveBeenCalledWith(3, 10);
            expect(getCounter(container).textContent).toBe('3/9 ');
        });

        it('只有一页时隐藏并标记为禁用', () => {
            const { container, setProps } = renderPagination({ hideOnSinglePage: true, size: 'small', total: 10 });
            expect(container.firstElementChild).toBeNull();
            setProps({ disabled: true, size: 'small', total: 90 });
            expect(container.firstElementChild).toHaveClass(`${prefixCls}-disabled`);
            expect(getCounter(container)).toHaveClass(`${prefixCls}-item-all-disabled`);
        });
    });

    it('设置 showSizeChanger 时，只有一页也保持显示并给出警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            const { container } = render(() => <Pagination hideOnSinglePage showSizeChanger total={10} />);
            expect(container.querySelector(`.${prefixCls}-switch`)).not.toBeNull();
            expect(warn).toHaveBeenCalledWith(expect.stringContaining('[Semi Pagination]'));
        } finally {
            warn.mockRestore();
        }
    });

    it('禁用所有页码与尺寸切换器', async () => {
        const onChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
        const { container } = render(() => <Pagination disabled defaultCurrentPage={5} showSizeChanger total={200} onChange={onChange} />);
        expect(container.querySelector('ul')).toHaveClass(`${prefixCls}-disabled`);
        expect(getActivePage(container)).toHaveClass(`${prefixCls}-item-all-disabled-active`);
        expect(getPageItems(container).every((button) => button.disabled)).toBe(true);
        await userEvent.click(screen.getByRole('button', { name: pageName(6) }));
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
        expect(onChange).not.toHaveBeenCalled();
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-select`)).toHaveClass(`${BASE_CLASS_PREFIX}-select-disabled`);
        await userEvent.hover(screen.getAllByRole('button', { name: zh_CN.Pagination.more })[0]);
        expect(document.querySelector(`.${prefixCls}-rest-list`)).toBeNull();
    });

    it('禁用的 Pagination 在 click 的 Tooltip 中被当作禁用触发器：外包 span 是停靠点，Pagination 不接收指针', async () => {
        const [disabled, setDisabled] = createSignal(true);
        const { container } = render(() => (
            <Tooltip wrapperClassName="probe" content="hint" motion={false} trigger="click">
                {(trigger) => <Pagination disabled={disabled()} total={200} {...trigger()} />}
            </Tooltip>
        ));
        const root = container.querySelector(`ul.${prefixCls}`) as HTMLElement;
        const span = container.querySelector('.probe') as HTMLElement;
        expect(span).toContainElement(root);
        expect(span).toHaveAttribute('tabindex', '0');
        expect(span.style.cursor).toBe('not-allowed');
        expect(root.style.pointerEvents).toBe('none');
        await userEvent.click(span);
        await waitFor(() => expect(screen.getByText('hint')).toBeInTheDocument());

        setDisabled(false);
        expect(container.querySelector('.probe')).toBeNull();
        expect(root.style.pointerEvents).toBe('');
    });

    it('两种尺寸下 data-* 属性都透传到根元素', () => {
        const { setProps } = renderPagination({ 'data-foo': 'bar', 'data-testid': 'pagination', total: 200 } as PaginationProps);
        expect(screen.getByTestId('pagination').tagName).toBe('UL');
        expect(screen.getByTestId('pagination')).toHaveAttribute('data-foo', 'bar');
        setProps({ 'data-testid': 'pagination', size: 'small', total: 200 } as PaginationProps);
        expect(screen.getByTestId('pagination').tagName).toBe('UL');
    });

    describe('语义', () => {
        it('是由原生按钮组成的列表，并标记当前页', () => {
            render(() => <Pagination defaultCurrentPage={10} showQuickJumper showSizeChanger showTotal total={200} />);
            const list = screen.getByRole('list');
            expect([...list.children].every((child) => child.tagName === 'LI')).toBe(true);
            expect(screen.getByRole('button', { name: pageName(10) })).toHaveAttribute('aria-current', 'page');
            expect(screen.getByRole('button', { name: pageName(9) })).not.toHaveAttribute('aria-current');
            expect(screen.getAllByRole('button', { name: zh_CN.Pagination.more })).toHaveLength(2);
            expect(screen.getByRole('spinbutton', { name: zh_CN.Pagination.jumpTo })).toBeInTheDocument();
        });

        it('上一页与下一页按钮以自定义的可见文本作为名称', () => {
            render(() => <Pagination nextText="Later" prevText="Earlier" total={200} />);
            expect(screen.getByRole('button', { name: 'Earlier' })).toHaveClass(`${prefixCls}-prev`);
            expect(screen.getByRole('button', { name: 'Later' })).toHaveClass(`${prefixCls}-next`);
        });

        it('prevText 与 nextText 没有文字内容时，由语言包命名', () => {
            render(() => <Pagination nextText={<span aria-hidden="true">{'>'}</span>} prevText={<svg data-testid="prev-icon" />} total={200} />);
            expect(screen.getByRole('button', { name: zh_CN.Pagination.prev })).toHaveClass(`${prefixCls}-prev`);
            expect(screen.getByRole('button', { name: zh_CN.Pagination.next })).toHaveClass(`${prefixCls}-next`);
        });
    });

    it('回写 pageSize 与内部相同的值时，保持当前页', async () => {
        const onChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
        function Controlled() {
            const [size, setSize] = createSignal(10);
            return <Pagination defaultCurrentPage={5} pageSize={size()} showSizeChanger total={200} onChange={onChange} onPageSizeChange={setSize} />;
        }
        const { container } = render(() => <Controlled />);
        await userEvent.click(screen.getByRole('combobox'));
        await userEvent.click(await screen.findByText('每页条数：20'));
        expect(onChange.mock.calls).toEqual([[3, 20]]);
        expect(getActivePage(container)).toHaveTextContent(/^3$/);
    });

    it('small 尺寸下 showSizeChanger 不生效，单页时仍然隐藏且不给出警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            const { container } = render(() => <Pagination hideOnSinglePage showSizeChanger size="small" total={5} />);
            expect(container.firstElementChild).toBeNull();
            expect(warn).not.toHaveBeenCalled();
        } finally {
            warn.mockRestore();
        }
    });

    it('没有任何页时，快速跳转不可用', () => {
        const { container } = render(() => <Pagination showQuickJumper total={0} />);
        expect(getJumper(container)).toBeDisabled();
    });

    it('使用 LocaleProvider 提供的语言', () => {
        const { container } = render(() => (
            <LocaleProvider locale={en_US}>
                <Pagination showQuickJumper showSizeChanger showTotal total={200} />
            </LocaleProvider>
        ));
        expect(container.querySelector(`.${prefixCls}-total`)).toHaveTextContent(/^Total pages: 20$/);
        expect(getSelectionText(container)).toHaveTextContent(/^Items per page: 10$/);
        expect(container.querySelector(`.${prefixCls}-quickjump`)).toHaveTextContent(/^Jump to page$/);
    });

    it('切换语言或每页条数后，每页条数选择器显示新的文案', () => {
        const [locale, setLocale] = createSignal(zh_CN);
        const [pageSize, setPageSize] = createSignal(10);
        const { container } = render(() => (
            <LocaleProvider locale={locale()}>
                <Pagination pageSize={pageSize()} showSizeChanger total={200} />
            </LocaleProvider>
        ));
        setLocale(en_US);
        expect(getSelectionText(container)).toHaveTextContent(/^Items per page: 10$/);
        setPageSize(20);
        expect(getSelectionText(container)).toHaveTextContent(/^Items per page: 20$/);
    });

    describe('函数组件', () => {
        it('ref 指向根元素，其他属性透传到根元素', () => {
            let ref: HTMLUListElement | undefined;
            const { container, setProps } = renderPagination({ ref: (el: HTMLUListElement) => (ref = el), id: 'pager', 'aria-label': 'Pages', total: 200 });
            expect(ref).toBe(container.querySelector('ul'));
            expect(ref).toHaveAttribute('id', 'pager');
            expect(ref).toHaveAttribute('aria-label', 'Pages');
            setProps({ ref: (el: HTMLUListElement) => (ref = el), id: 'pager', 'aria-label': 'Pages', size: 'small', total: 200 });
            expect(ref?.tagName).toBe('UL');
            expect(ref).toHaveAttribute('id', 'pager');
        });

        it('ref 类型是两种尺寸共同的根元素 ul', () => {
            type Ref = NonNullable<PaginationProps['ref']>;
            expectTypeOf<Ref>().toEqualTypeOf<HTMLUListElement | ((el: HTMLUListElement) => void)>();
        });

        it('读取 semiGlobal overrideDefaultProps 中的默认值', () => {
            semiGlobal.config.overrideDefaultProps = { Pagination: { showTotal: true, defaultCurrentPage: 3 } };
            const { container } = render(() => <Pagination total={200} />);
            expect(container.querySelector(`.${prefixCls}-total`)).not.toBeNull();
            expect(getActivePage(container)).toHaveTextContent(/^3$/);
        });

        it('全局 InputNumber 默认值不给快速跳转框加清除按钮与前后缀', async () => {
            semiGlobal.config.overrideDefaultProps = { InputNumber: { showClear: true, prefix: 'x', suffix: 'y', insetLabel: 'l', addonBefore: 'b', addonAfter: 'a' } };
            const { container } = render(() => <Pagination showQuickJumper total={200} />);
            await userEvent.type(getJumper(container), '3');
            expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();
            expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-prefix, .${BASE_CLASS_PREFIX}-input-suffix, .${BASE_CLASS_PREFIX}-input-prepend, .${BASE_CLASS_PREFIX}-input-append`)).toBeNull();
        });
    });

    it('键盘翻页后，页码按钮保持焦点（页码移动不重建按钮）', async () => {
        render(() => <Pagination defaultCurrentPage={10} total={200} />);
        const next = screen.getByRole('button', { name: pageName(11) });
        next.focus();
        await userEvent.keyboard('{Enter}');
        expect(screen.getByRole('button', { name: pageName(11) })).toBe(next);
        expect(next).toHaveFocus();

        const first = render(() => <Pagination defaultCurrentPage={4} total={200} />);
        const five = within(first.container).getByRole('button', { name: pageName(5) });
        five.focus();
        await userEvent.keyboard('{Enter}');
        expect(five).toHaveFocus();
    });

    it('prevText、nextText 为 0 时按钮显示 0 并由它命名', () => {
        const { container } = render(() => <Pagination defaultCurrentPage={2} nextText={0} prevText={0} total={200} />);
        const prev = container.querySelector(`.${prefixCls}-prev`);
        const next = container.querySelector(`.${prefixCls}-next`);
        expect(prev).toHaveTextContent(/^0$/);
        expect(prev).not.toHaveAttribute('aria-label');
        expect(next).toHaveTextContent(/^0$/);
        expect(next).not.toHaveAttribute('aria-label');
    });
});
