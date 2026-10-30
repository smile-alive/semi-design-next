import { flushSync } from 'svelte';
import { render, screen, waitFor, within } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { clickOutside, tabTo } from '@test/utils/browser';
import type { CascaderChangeValue, CascaderData, CascaderProps, CascaderValue } from '..';
import { createStore } from '../../_base/__tests__/store.svelte';
import CascaderCase from './cascader-case.svelte';

const treeData: CascaderData[] = [
    { label: '亚洲', value: 'Asia', children: [{ label: '中国', value: 'China', children: [{ label: '北京', value: 'Beijing' }] }] },
    {
        label: '北美洲',
        value: 'North America',
        children: [
            { label: '美国', value: 'United States' },
            { label: '加拿大', value: 'Canada' },
        ],
    },
];

function setup(props: Omit<CascaderProps, 'value' | 'treeData'> = {}, { data = treeData, target, value }: { data?: CascaderData[]; target?: HTMLElement; value?: CascaderValue } = {}) {
    const store = createStore<{ value?: CascaderValue; accept: boolean; log: string[]; treeData: CascaderData[] }>({ value, accept: true, log: [], treeData: data });
    const view = render(CascaderCase, { props: { mode: 'bind', store, props }, ...(target ? { target } : {}) });
    flushSync();
    // screen only queries the document, a ShadowRoot needs its own query
    const combobox = target ? (target.querySelector('[role="combobox"]') as HTMLElement) : screen.getByRole('combobox', { name: 'Region' });
    return { store, combobox, unmount: view.unmount };
}

const leaves = Array.from({ length: 30 }, (_, index) => ({ label: `区 ${index}`, value: `${index}` }));
const manyLeaves = Array.from({ length: 100 }, (_, index) => ({ label: `区 ${index}`, value: `${index}` }));
const city: CascaderData[] = [{ label: '城市', value: 'city', children: manyLeaves }];

function mountShadow(copyStyles = false) {
    const host = document.createElement('div');
    document.body.append(host);
    const shadow = host.attachShadow({ mode: 'open' });
    // the list scrolls only under the component styles, which the document holds
    if (copyStyles) {
        shadow.append(...Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'), (node) => node.cloneNode(true)));
    }
    const target = document.createElement('div');
    shadow.append(target);
    return { host, shadow, target };
}

const active = (host: HTMLElement) => document.getElementById(host.getAttribute('aria-activedescendant') ?? '')?.textContent?.trim();

describe('Svelte Cascader 浏览器：键盘与焦点', () => {
    it('Tab 聚焦 combobox，ArrowDown 打开并移动，Right 展开，Enter 选中并关闭，焦点留在 combobox', async () => {
        const onChange = vi.fn<(value: CascaderChangeValue) => void>();
        const { store, combobox } = setup({ onChange });
        await userEvent.tab();
        expect(combobox).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        await screen.findByRole('tree');
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
        await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowRight}{ArrowRight}');
        expect(active(combobox)).toBe('美国');
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(screen.queryByRole('tree')).toBe(null));
        expect(onChange).toHaveBeenCalledWith(['North America', 'United States']);
        expect(store.value).toEqual(['North America', 'United States']);
        expect(combobox).toHaveFocus();
        expect(combobox).toHaveAttribute('aria-expanded', 'false');
    });

    it('Escape 关闭下拉，焦点留在 combobox；点击外部关闭并失焦', async () => {
        const { combobox } = setup();
        combobox.focus();
        await userEvent.keyboard('{ArrowDown}');
        await screen.findByRole('tree');
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('tree')).toBe(null));
        expect(combobox).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        await screen.findByRole('tree');
        await clickOutside();
        await waitFor(() => expect(screen.queryByRole('tree')).toBe(null));
        expect(combobox).not.toHaveFocus();
    });

    it('可搜索时输入框接管焦点，输入过滤后 ArrowDown 与 Enter 选中结果，关闭后焦点回到触发器', async () => {
        const { store, combobox } = setup({ filterTreeNode: true });
        await userEvent.click(combobox);
        const input = await screen.findByRole('combobox', { name: 'Region' });
        expect(input.tagName).toBe('INPUT');
        await waitFor(() => expect(input).toHaveFocus());
        await userEvent.keyboard('加拿');
        await screen.findByRole('listbox');
        await userEvent.keyboard('{ArrowDown}');
        expect(active(input)).toBe('北美洲 / 加拿大');
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(store.value).toEqual(['North America', 'Canada']));
        await waitFor(() => expect(screen.queryByRole('listbox')).toBe(null));
        expect(document.querySelector('.semi-cascader')).toContainElement(document.activeElement as HTMLElement);
    });

    it('多选用键盘勾选后下拉保持打开', async () => {
        const { store, combobox } = setup({ multiple: true });
        await userEvent.click(combobox);
        await screen.findByRole('tree');
        await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowRight}{ArrowRight}{Enter}');
        await waitFor(() => expect(store.value).toEqual([['North America', 'United States']]));
        expect(screen.getByRole('tree')).toBeInTheDocument();
    });

    it('关闭时按 End 打开，当前项滚动到列表可视区', async () => {
        const { combobox } = setup({}, { data: leaves });
        await tabTo(combobox);
        await userEvent.keyboard('{End}');
        const option = await waitFor(() => {
            const element = document.getElementById(combobox.getAttribute('aria-activedescendant') ?? '') as HTMLElement;
            expect(element).toHaveTextContent('区 29');
            return element;
        });
        const list = option.closest<HTMLElement>('.semi-cascader-option-list') as HTMLElement;
        await waitFor(() => expect(option.getBoundingClientRect().bottom).toBeLessThanOrEqual(list.getBoundingClientRect().bottom + 1));
    });

    it('ShadowRoot 内关闭时按 End 打开，当前项滚动到列表可视区', async () => {
        const { host, shadow, target } = mountShadow(true);
        const { combobox, unmount } = setup({}, { data: leaves, target });
        try {
            combobox.focus();
            await userEvent.keyboard('{End}');
            const option = await waitFor(() => {
                const element = shadow.getElementById(combobox.getAttribute('aria-activedescendant') ?? '') as HTMLElement;
                expect(element).toHaveTextContent('区 29');
                return element;
            });
            const list = option.closest<HTMLElement>('.semi-cascader-option-list') as HTMLElement;
            await waitFor(() => expect(option.getBoundingClientRect().bottom).toBeLessThanOrEqual(list.getBoundingClientRect().bottom + 1));
        } finally {
            unmount();
            host.remove();
        }
    });

    it('ShadowRoot 内可搜索的 Cascader 按 Escape 关闭后，焦点回到触发器', async () => {
        const { host, shadow, target } = mountShadow();
        const { combobox, unmount } = setup({ filterTreeNode: true }, { target });
        try {
            await userEvent.click(combobox);
            await waitFor(() => expect(shadow.activeElement?.tagName).toBe('INPUT'));
            await userEvent.keyboard('{Escape}');
            await waitFor(() => expect(shadow.activeElement).toBe(combobox));
        } finally {
            unmount();
            host.remove();
        }
    });
});

describe('Svelte Cascader 浏览器：虚拟搜索列表', () => {
    it('滚动到按键移动到的选项，且不新增 Tab 停靠点', async () => {
        const { combobox, unmount } = setup({ filterTreeNode: true, virtualizeInSearch: { height: 144, itemSize: 36 } }, { data: city });
        const after = document.createElement('button');
        after.textContent = 'after';
        document.body.append(after);
        try {
            await userEvent.click(combobox);
            const input = await screen.findByRole('combobox', { name: 'Region' });
            expect(input.tagName).toBe('INPUT');
            await userEvent.type(input, '区');
            const listbox = await screen.findByRole('listbox');
            await userEvent.keyboard('{ArrowUp}');
            const option = () => document.getElementById(input.getAttribute('aria-activedescendant') ?? '') as HTMLElement;
            await waitFor(() => expect(option()).toHaveTextContent('城市 / 区 99'));
            expect(option().getBoundingClientRect().bottom).toBeLessThanOrEqual(listbox.getBoundingClientRect().bottom);
            await userEvent.keyboard('{Tab}');
            expect(after).toHaveFocus();
            await waitFor(() => expect(listbox).not.toBeInTheDocument());
        } finally {
            after.remove();
            unmount();
        }
    });

    it('默认高度下最后一项与普通列表一样带选项内边距且在下拉框内可见', async () => {
        const { combobox } = setup({ filterTreeNode: true, virtualizeInSearch: { itemSize: 36 } }, { data: city });
        await userEvent.click(combobox);
        const input = await screen.findByRole('combobox', { name: 'Region' });
        await userEvent.type(input, '区');
        const listbox = await screen.findByRole('listbox');
        const [first] = within(listbox).getAllByRole('option');
        expect(getComputedStyle(first).paddingTop).not.toBe('0px');
        await userEvent.keyboard('{ArrowUp}');
        const option = () => document.getElementById(input.getAttribute('aria-activedescendant') ?? '') as HTMLElement;
        await waitFor(() => expect(option()).toHaveTextContent('城市 / 区 99'));
        const rect = option().getBoundingClientRect();
        const lists = listbox.getBoundingClientRect();
        expect(rect.top).toBeGreaterThanOrEqual(lists.top);
        expect(rect.bottom).toBeLessThanOrEqual(lists.bottom);
    });

    it('滚动列表后渲染靠后的选项', async () => {
        const { combobox } = setup({ filterTreeNode: true, virtualizeInSearch: { height: 144, itemSize: 36 } }, { data: city });
        await userEvent.click(combobox);
        await userEvent.type(await screen.findByRole('combobox', { name: 'Region' }), '区');
        const options = await screen.findAllByRole('option');
        const outer = options[0].parentElement?.parentElement as HTMLElement;
        const hasOption = (text: string) => screen.queryAllByRole('option').some((item) => item.textContent?.includes(text));
        expect(hasOption('区 0')).toBe(true);
        expect(hasOption('区 50')).toBe(false);
        outer.scrollTop = 36 * 50;
        await waitFor(() => expect(hasOption('区 50')).toBe(true));
        expect(hasOption('区 0')).toBe(false);
    });
});

describe('Svelte Cascader 浏览器：loadData', () => {
    it('点击未加载的节点后异步加载并展开下一列', async () => {
        const data: CascaderData[] = [
            { label: 'Node1', value: '0-0' },
            { label: 'Node2', value: '0-1' },
            { label: 'Node3', value: '0-2', isLeaf: true },
        ];
        const loadData = (selected: CascaderData[]) => {
            const { label, value, children } = selected[selected.length - 1];
            return new Promise<void>((resolve) => {
                if (children) {
                    resolve();
                    return;
                }
                setTimeout(() => {
                    const node = store.treeData.find((item) => item.value === value);
                    if (node) {
                        node.children = [1, 2].map((index) => ({ label: `${label} - ${index}`, value: `${label}-${index}`, isLeaf: selected.length > 1 }));
                    }
                    resolve();
                }, 50);
            });
        };
        const { store, combobox } = setup({ loadData }, { data });
        await userEvent.click(combobox);
        await userEvent.click(await screen.findByText('Node1'));
        await waitFor(() => expect(screen.getByText('Node1 - 1')).toBeInTheDocument());
        await waitFor(() => expect(screen.getByRole('treeitem', { name: /Node1$/ })).not.toHaveAttribute('aria-busy'));
    });
});

describe('Svelte Cascader 浏览器：输入与表单', () => {
    it('在触发器上按 Enter 打开下拉框，且不提交外层表单', async () => {
        const onSubmit = vi.fn<(event: Event) => void>((event) => event.preventDefault());
        const form = document.createElement('form');
        form.addEventListener('submit', onSubmit);
        const target = document.createElement('div');
        const submit = document.createElement('button');
        submit.type = 'submit';
        submit.textContent = 'submit';
        form.append(target, submit);
        document.body.append(form);
        const { combobox, unmount } = setup({ filterTreeNode: true }, { target });
        try {
            combobox.focus();
            await userEvent.keyboard('{Enter}');
            await waitFor(() => expect(document.querySelector('.semi-cascader-option-list')).not.toBeNull());
            expect(onSubmit).not.toHaveBeenCalled();
        } finally {
            unmount();
            form.remove();
        }
    });

    it('大列表输入后立即按 Enter，aria-activedescendant 不指向 Enter 不会选中的旧选项', async () => {
        const options = Array.from({ length: 5000 }, (_, index) => ({ label: `Option ${index}`, value: `${index}` }));
        const onChange = vi.fn<(value: CascaderChangeValue) => void>();
        const { combobox } = setup({ filterTreeNode: true, onChange }, { data: options });
        await userEvent.click(combobox);
        const input = await screen.findByRole('combobox', { name: 'Region' });
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(input).toHaveAttribute('aria-activedescendant'));
        let activeAtEnter: string | undefined;
        const record = (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
                const id = (event.target as HTMLElement).getAttribute('aria-activedescendant');
                activeAtEnter = id ? (document.getElementById(id)?.textContent ?? undefined) : undefined;
            }
        };
        document.addEventListener('keydown', record, true);
        try {
            await userEvent.keyboard('1{Enter}');
        } finally {
            document.removeEventListener('keydown', record, true);
        }
        expect(activeAtEnter).toBeUndefined();
        expect(onChange).not.toHaveBeenCalled();
    });
});

describe.each([
    ['单选', {}],
    ['单选可搜索', { filterTreeNode: true }],
    ['多选可搜索', { multiple: true, filterTreeNode: true }],
] as const)('%s Cascader 与其清除按钮之间的焦点移动保持在内部', (_, props) => {
    const path = ['North America', 'Canada'];
    const value = 'multiple' in props ? [path] : path;

    const renderWithSpies = () => {
        const onFocus = vi.fn<NonNullable<CascaderProps['onFocus']>>();
        const onBlur = vi.fn<NonNullable<CascaderProps['onBlur']>>();
        const view = setup({ showClear: true, onFocus, onBlur, ...props }, { value });
        const after = document.createElement('button');
        after.textContent = 'after';
        document.body.append(after);
        return {
            onFocus,
            onBlur,
            after,
            combobox: view.combobox,
            cleanup: () => {
                after.remove();
                view.unmount();
            },
        };
    };

    const getClear = () => document.querySelector('.semi-cascader-clearbtn');

    const tabToClearAndBack = async (combobox: HTMLElement) => {
        await userEvent.keyboard('{Tab}');
        expect(getClear()).toHaveFocus();
        await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
        expect(combobox).toHaveFocus();
    };

    it('Tab 进入触发器发出一次 focus，到清除按钮再返回不重复发出也不发出 blur，弹层保持关闭', async () => {
        const { onFocus, onBlur, combobox, cleanup } = renderWithSpies();
        try {
            await tabTo(combobox);
            expect(onFocus).toHaveBeenCalledTimes(1);
            await tabToClearAndBack(combobox);
            expect(combobox).toHaveAttribute('aria-expanded', 'false');
            expect(onFocus).toHaveBeenCalledTimes(1);
            expect(onBlur).not.toHaveBeenCalled();
        } finally {
            cleanup();
        }
    });

    it('通过点击打开弹层时，Tab 到清除按钮再返回会保持打开，且不发出 blur', async () => {
        const { onFocus, onBlur, combobox, cleanup } = renderWithSpies();
        try {
            await userEvent.click(combobox);
            await waitFor(() => expect(screen.getByRole('tree')).toBeInTheDocument());
            // a searchable Cascader hands the combobox role to its input while open
            const active = document.activeElement as HTMLElement;
            await userEvent.keyboard('{Tab}');
            expect(getClear()).toHaveFocus();
            await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
            expect(document.activeElement).toBe(active);
            expect(screen.getByRole('tree')).toBeInTheDocument();
            expect(onFocus).toHaveBeenCalledTimes(1);
            expect(onBlur).not.toHaveBeenCalled();
        } finally {
            cleanup();
        }
    });

    it('Tab 能离开 Cascader 到达下一个控件', async () => {
        const { combobox, after, cleanup } = renderWithSpies();
        try {
            await tabTo(combobox);
            await tabTo(after);
            expect(after).toHaveFocus();
        } finally {
            cleanup();
        }
    });

    it('Tab 移出 Cascader 时只发出一次 blur', async () => {
        const { onBlur, combobox, after, cleanup } = renderWithSpies();
        try {
            await tabTo(combobox);
            await tabTo(after);
            expect(onBlur).toHaveBeenCalledTimes(1);
        } finally {
            cleanup();
        }
    });

    it('打开时按 Tab 关闭下拉并离开，blur 恰好一次', async () => {
        const { onBlur, combobox, after, cleanup } = renderWithSpies();
        try {
            await tabTo(combobox);
            await userEvent.keyboard('{ArrowDown}');
            await waitFor(() => expect(screen.getByRole('tree')).toBeInTheDocument());
            await userEvent.keyboard('{ArrowDown}{ArrowRight}');
            expect(onBlur).not.toHaveBeenCalled();
            await tabTo(after);
            await waitFor(() => expect(screen.queryByRole('tree')).toBeNull());
            expect(onBlur).toHaveBeenCalledTimes(1);
        } finally {
            cleanup();
        }
    });
});

describe('Svelte Cascader 浏览器：focus 与 blur', () => {
    const renderWithSpies = (props: Omit<CascaderProps, 'value' | 'treeData'> = {}) => {
        const onFocus = vi.fn<NonNullable<CascaderProps['onFocus']>>();
        const onBlur = vi.fn<NonNullable<CascaderProps['onBlur']>>();
        const view = setup({ motion: false, onFocus, onBlur, ...props });
        const after = document.createElement('button');
        after.textContent = 'after';
        document.body.append(after);
        return {
            onFocus,
            onBlur,
            after,
            combobox: view.combobox,
            cleanup: () => {
                after.remove();
                view.unmount();
            },
        };
    };
    const isClosed = () => waitFor(() => expect(screen.queryByRole('tree')).toBeNull());
    const isOpened = () => screen.findByRole('tree');

    it('脚本 focus 发出一次 focus，焦点移出时发出一次 blur', async () => {
        const { onFocus, onBlur, combobox, after, cleanup } = renderWithSpies();
        try {
            combobox.focus();
            expect(onFocus).toHaveBeenCalledTimes(1);
            expect(onBlur).not.toHaveBeenCalled();
            await tabTo(after);
            expect(onFocus).toHaveBeenCalledTimes(1);
            expect(onBlur).toHaveBeenCalledTimes(1);
        } finally {
            cleanup();
        }
    });

    it('Esc 关闭下拉时焦点仍在组件内，不发出 blur', async () => {
        const { onFocus, onBlur, combobox, cleanup } = renderWithSpies();
        try {
            await userEvent.click(combobox);
            await isOpened();
            await userEvent.keyboard('{Escape}');
            await isClosed();
            expect(onFocus).toHaveBeenCalledTimes(1);
            expect(onBlur).not.toHaveBeenCalled();
        } finally {
            cleanup();
        }
    });

    it('点击触发器收起下拉不发出 blur', async () => {
        const { onFocus, onBlur, combobox, cleanup } = renderWithSpies();
        try {
            await userEvent.click(combobox);
            await isOpened();
            await userEvent.click(combobox);
            await isClosed();
            expect(onFocus).toHaveBeenCalledTimes(1);
            expect(onBlur).not.toHaveBeenCalled();
        } finally {
            cleanup();
        }
    });

    it('单选选中叶子后关闭下拉立即发出 blur，再次点击打开重新发出 focus', async () => {
        const { onFocus, onBlur, combobox, cleanup } = renderWithSpies();
        try {
            await userEvent.click(combobox);
            await isOpened();
            await userEvent.click(screen.getByText('亚洲'));
            await userEvent.click(screen.getByText('中国'));
            expect(onBlur).not.toHaveBeenCalled();
            await userEvent.click(screen.getByText('北京'));
            await isClosed();
            expect(onBlur).toHaveBeenCalledTimes(1);
            expect(onFocus).toHaveBeenCalledTimes(1);
            await userEvent.click(combobox);
            await isOpened();
            expect(onFocus).toHaveBeenCalledTimes(2);
            expect(onBlur).toHaveBeenCalledTimes(1);
        } finally {
            cleanup();
        }
    });

    it('多选选中不发出 blur', async () => {
        const { onFocus, onBlur, combobox, cleanup } = renderWithSpies({ multiple: true });
        try {
            await userEvent.click(combobox);
            await isOpened();
            await userEvent.click(screen.getByText('亚洲'));
            await userEvent.click(screen.getByText('中国'));
            await userEvent.click(screen.getByText('北京'));
            expect(onFocus).toHaveBeenCalledTimes(1);
            expect(onBlur).not.toHaveBeenCalled();
        } finally {
            cleanup();
        }
    });

    it('在组件外按下鼠标时发出一次 blur 并关闭下拉', async () => {
        const { onBlur, combobox, cleanup } = renderWithSpies();
        try {
            await userEvent.click(combobox);
            await isOpened();
            await clickOutside();
            await isClosed();
            expect(onBlur).toHaveBeenCalledTimes(1);
        } finally {
            cleanup();
        }
    });
});
