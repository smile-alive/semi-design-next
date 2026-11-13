import { within, type BoundFunctions, type queries } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { expect, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';
import { checkPattern, type CheckOptions } from '@test/utils/apg';
import { defineSpec, type SpecHandle, type SpecMount, type SpecOptions } from './shared/define-spec';
import { press } from './shared/press';

export interface TabsSpecItem {
    itemKey: string;
    tab: string;
    content?: string;
    disabled?: boolean;
    closable?: boolean;
}

/** Framework-free Tabs props; each fixture turns `items` into its own children, slots or snippets */
export interface TabsSpecProps {
    items: TabsSpecItem[];
    'aria-label'?: string;
    /** `undefined` is uncontrolled, `null` is controlled with nothing selected */
    activeKey?: string | null;
    defaultActiveKey?: string;
    type?: 'line' | 'card' | 'button';
    size?: 'small' | 'medium' | 'large';
    tabPosition?: 'top' | 'left';
    keepDOM?: boolean;
    lazyRender?: boolean;
    direction?: 'ltr' | 'rtl';
    onChange?: (activeKey: string) => void;
    // React passes a synthetic event, so only `type` is common to every framework
    onTabClick?: (activeKey: string, event: { type: string }) => void;
    onTabClose?: (tabKey: string) => void;
}

const prefix = `${BASE_CLASS_PREFIX}-tabs`;

const threeItems: TabsSpecItem[] = [
    { itemKey: 'a', tab: 'A', content: 'content a' },
    { itemKey: 'b', tab: 'B', content: 'content b' },
    { itemKey: 'c', tab: 'C', content: 'content c' },
];

const withItem = (key: string, patch: Partial<TabsSpecItem>, items = threeItems) => items.map((item) => (item.itemKey === key ? { ...item, ...patch } : item));

export function tabsSpec(mount: SpecMount<TabsSpecProps>, options: SpecOptions = {}) {
    defineSpec('Tabs（共享 spec）', options, (test) => {
        let view: BoundFunctions<typeof queries>;
        let handle: SpecHandle<TabsSpecProps>;

        async function render(props: Partial<TabsSpecProps> = {}) {
            handle = await mount({ items: threeItems, ...props });
            view = within(handle.container);
            return handle;
        }

        const tab = (name: string) => view.getByRole('tab', { name });
        const tabs = () => view.queryAllByRole('tab');
        // Svelte keeps the whitespace around a snippet's text
        const textOf = (element: Element) => element.textContent?.trim();
        const tabNames = () => tabs().map(textOf);
        const selectedTab = () => {
            const selected = view.queryByRole('tab', { selected: true });
            return selected ? textOf(selected) : null;
        };
        const tabStops = () =>
            tabs()
                .filter((item) => item.getAttribute('tabindex') === '0')
                .map(textOf);
        const panels = () => view.queryAllByRole('tabpanel', { hidden: true });
        const closeButtons = () => view.queryAllByRole('button');
        const root = () => handle.container.querySelector(`.${prefix}`);
        const bar = () => handle.container.querySelector(`.${prefix}-bar`);
        const content = () => handle.container.querySelector(`.${prefix}-content`);

        test('渲染 tablist、tab 和 tabpanel，默认选中第一个页签并显示它的面板', async () => {
            await render();
            expect(view.getByRole('tablist')).toBeInTheDocument();
            expect(tabNames()).toEqual(['A', 'B', 'C']);
            expect(selectedTab()).toBe('A');
            expect(panels()).toHaveLength(3);
            expect(view.getByRole('tabpanel', { name: 'A' })).toHaveTextContent('content a');
        });

        test('defaultActiveKey 指定初始选中的页签', async () => {
            await render({ defaultActiveKey: 'b' });
            expect(selectedTab()).toBe('B');
            expect(view.getByRole('tabpanel')).toHaveTextContent('content b');
        });

        test('type、size 和 tabPosition 在根节点、标签栏、标签和内容上设置类名，tablist 的 aria-orientation 随方向变化', async () => {
            await render();
            expect(view.getByRole('tablist')).toHaveAttribute('aria-orientation', 'horizontal');
            expect(root()).toHaveClass(prefix, `${prefix}-top`);
            expect(tab('A')).toHaveClass(`${prefix}-tab-line`, `${prefix}-tab-top`, `${prefix}-tab-single`);

            await handle.update({ tabPosition: 'left', size: 'small', type: 'card' });
            expect(view.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
            expect(bar()).toHaveClass(`${prefix}-bar-card`, `${prefix}-bar-left`);
            expect(root()).toHaveClass(`${prefix}-left`);
            expect(content()).toHaveClass(`${prefix}-content-left`);
            expect(tab('A')).toHaveClass(`${prefix}-tab-card`, `${prefix}-tab-left`, `${prefix}-tab-small`);
            expect(tab('A')).not.toHaveClass(`${prefix}-tab-medium`);
        });

        test('roving tabindex：只有选中的页签可 Tab 聚焦；标签与面板用 aria-controls、aria-labelledby 互相指向', async () => {
            await render({ items: withItem('b', { disabled: true }) });
            expect(tabs().map((item) => item.tabIndex)).toEqual([0, -1, -1]);
            expect(tab('B')).toHaveAttribute('aria-disabled', 'true');
            expect(tab('A')).toHaveAttribute('aria-disabled', 'false');
            expect(panels().map((panel) => panel.getAttribute('aria-hidden'))).toEqual(['false', 'true', 'true']);
            expect(panels().map((panel) => panel.tabIndex)).toEqual([0, 0, 0]);
            tabs().forEach((item, i) => {
                expect(item.getAttribute('aria-controls')).toBe(panels()[i].id);
                expect(panels()[i].getAttribute('aria-labelledby')).toBe(item.id);
            });
            expect(new Set(panels().map((panel) => panel.id)).size).toBe(3);
        });

        test('Tab 键离开选中的页签后焦点不落在其他页签上', async () => {
            await render();
            tab('A').focus();
            await userEvent.tab();
            expect(tabs()).not.toContain(document.activeElement);
        });

        test('keepDOM 为 false 时只有所选面板在文档中，且只有它被标签的 aria-controls 指向', async () => {
            await render({ keepDOM: false });
            expect(panels()).toHaveLength(1);
            expect(view.getByRole('tabpanel')).toHaveTextContent(/^content a$/);
            expect(tabs().map((item) => item.getAttribute('aria-controls'))).toEqual([panels()[0].id, null, null]);
            await userEvent.click(tab('C'));
            expect(panels()).toHaveLength(1);
            expect(view.getByRole('tabpanel')).toHaveTextContent(/^content c$/);
        });

        test('lazyRender 在面板首次激活时渲染内容，之后保留', async () => {
            await render({ lazyRender: true });
            expect(panels()).toHaveLength(3);
            expect(view.getByText('content a')).toBeInTheDocument();
            expect(view.queryByText('content b')).toBeNull();
            await userEvent.click(tab('B'));
            expect(view.getByText('content b')).toBeInTheDocument();
            await userEvent.click(tab('A'));
            expect(view.getByText('content b')).toBeInTheDocument();
            expect(view.queryByText('content c')).toBeNull();
        });

        test('非受控：点击切换页签，onChange 收到新 key；点击已选中的页签不调用 onChange', async () => {
            const onChange = vi.fn<NonNullable<TabsSpecProps['onChange']>>();
            await render({ onChange });
            await userEvent.click(tab('A'));
            expect(onChange).not.toHaveBeenCalled();
            await userEvent.click(tab('C'));
            expect(onChange).toHaveBeenCalledExactlyOnceWith('c');
            expect(selectedTab()).toBe('C');
            expect(view.getByRole('tabpanel')).toHaveTextContent('content c');
        });

        test('onTabClick 接收 key 和事件，点击已选中的页签也会调用', async () => {
            const onTabClick = vi.fn<NonNullable<TabsSpecProps['onTabClick']>>();
            await render({ onTabClick });
            await userEvent.click(tab('A'));
            expect(onTabClick).toHaveBeenCalledExactlyOnceWith('a', expect.objectContaining({ type: 'click' }));
            await userEvent.click(tab('C'));
            expect(onTabClick).toHaveBeenLastCalledWith('c', expect.objectContaining({ type: 'click' }));
        });

        test('键盘激活页签时 onTabClick 收到 keydown 事件', async () => {
            const onTabClick = vi.fn<NonNullable<TabsSpecProps['onTabClick']>>();
            await render({ onTabClick });
            tab('B').focus();
            await userEvent.keyboard('{Enter}');
            expect(onTabClick).toHaveBeenCalledExactlyOnceWith('b', expect.objectContaining({ type: 'keydown' }));
        });

        test('activeKey 为 undefined 时按非受控处理：取 defaultActiveKey，点击即切换', async () => {
            await render({ activeKey: undefined, defaultActiveKey: 'b' });
            expect(selectedTab()).toBe('B');
            await userEvent.click(tab('C'));
            expect(selectedTab()).toBe('C');
        });

        test('受控：点击只报告 key，选中项由 activeKey 决定', async () => {
            const onChange = vi.fn<NonNullable<TabsSpecProps['onChange']>>();
            await render({ activeKey: 'a', onChange });
            await userEvent.click(tab('B'));
            expect(onChange).toHaveBeenCalledExactlyOnceWith('b');
            expect(selectedTab()).toBe('A');
            await userEvent.click(tab('B'));
            expect(onChange).toHaveBeenCalledTimes(2);

            await handle.update({ activeKey: 'c' });
            expect(selectedTab()).toBe('C');
            expect(view.getByRole('tabpanel')).toHaveTextContent('content c');
        });

        test('activeKey 改回 undefined 后，从最后的受控 key 继续，点击即切换', async () => {
            await render({ activeKey: 'a' });
            await handle.update({ activeKey: 'c' });
            await handle.update({ activeKey: undefined });
            expect(selectedTab()).toBe('C');
            await userEvent.click(tab('A'));
            expect(selectedTab()).toBe('A');
        });

        test('activeKey 为 null 时不选中任何页签，点击只报告 key', async () => {
            const onChange = vi.fn<NonNullable<TabsSpecProps['onChange']>>();
            await render({ activeKey: null, onChange });
            expect(selectedTab()).toBeNull();
            await userEvent.click(tab('B'));
            expect(onChange).toHaveBeenCalledWith('b');
            expect(selectedTab()).toBeNull();
        });

        test('没有选中页签时（activeKey 为 null 或不在页签中），第一个启用的页签是唯一的 Tab 停靠点', async () => {
            await render({ activeKey: null, items: withItem('a', { disabled: true }) });
            expect(tabStops()).toEqual(['B']);
            await handle.update({ activeKey: 'missing' });
            expect(selectedTab()).toBeNull();
            expect(tabStops()).toEqual(['B']);
        });

        test('页签从无到有后，非受控的选中项是第一个启用的页签', async () => {
            await render({ items: [] });
            expect(tabs()).toHaveLength(0);
            await handle.update({
                items: [
                    { itemKey: 'a', tab: '甲', disabled: true },
                    { itemKey: 'b', tab: '乙' },
                ],
            });
            expect(tab('乙')).toHaveAttribute('aria-selected', 'true');
            expect(tab('甲')).toHaveAttribute('aria-selected', 'false');
        });

        test('删除选中的页签后，非受控的选中项回退到第一个启用的页签', async () => {
            await render({ items: withItem('a', { disabled: true }) });
            await userEvent.click(tab('C'));
            expect(selectedTab()).toBe('C');
            await handle.update({ items: withItem('a', { disabled: true }).slice(0, 2) });
            expect(selectedTab()).toBe('B');
        });

        test('非受控时在前面新增页签，选中项不变', async () => {
            await render({ defaultActiveKey: 'b' });
            await handle.update({ items: [{ itemKey: 'z', tab: 'Z' }, ...threeItems] });
            expect(selectedTab()).toBe('B');
        });

        test('点击禁用的页签不切换也不调用回调', async () => {
            const onChange = vi.fn<NonNullable<TabsSpecProps['onChange']>>();
            const onTabClick = vi.fn<NonNullable<TabsSpecProps['onTabClick']>>();
            await render({ onChange, onTabClick, items: withItem('b', { disabled: true }) });
            expect(handle.container.querySelectorAll(`.${prefix}-tab-disabled`)).toHaveLength(1);
            await userEvent.click(tab('B'));
            expect(onChange).not.toHaveBeenCalled();
            expect(onTabClick).not.toHaveBeenCalled();
            expect(selectedTab()).toBe('A');
        });

        test('禁用的页签聚焦后按 Enter 或 Space 不激活', async () => {
            const onChange = vi.fn<NonNullable<TabsSpecProps['onChange']>>();
            await render({ onChange, items: withItem('b', { disabled: true }) });
            tab('B').focus();
            await userEvent.keyboard('{Enter}');
            await userEvent.keyboard(' ');
            expect(onChange).not.toHaveBeenCalled();
            expect(selectedTab()).toBe('A');
        });

        test('键盘：方向键跳过禁用页签并循环移动，Home 和 End 跳转，Enter 与 Space 选中', async () => {
            const onChange = vi.fn<NonNullable<TabsSpecProps['onChange']>>();
            const items = [...withItem('c', { disabled: true }), { itemKey: 'd', tab: 'D', disabled: true }, { itemKey: 'e', tab: 'E' }];
            await render({ onChange, items });
            tab('B').focus();
            await userEvent.keyboard('{ArrowRight}');
            expect(tab('E')).toHaveFocus();
            await userEvent.keyboard('{ArrowRight}');
            expect(tab('A')).toHaveFocus();
            await userEvent.keyboard('{ArrowLeft}');
            expect(tab('E')).toHaveFocus();
            await userEvent.keyboard('{ArrowDown}');
            expect(tab('E')).toHaveFocus();
            await userEvent.keyboard('{Home}');
            expect(tab('A')).toHaveFocus();
            await userEvent.keyboard('{End}');
            expect(tab('E')).toHaveFocus();
            expect(onChange).not.toHaveBeenCalled();
            expect(selectedTab()).toBe('A');
            await userEvent.keyboard('{Enter}');
            expect(onChange).toHaveBeenCalledExactlyOnceWith('e');
            expect(selectedTab()).toBe('E');
            tab('A').focus();
            await userEvent.keyboard(' ');
            expect(selectedTab()).toBe('A');
        });

        test('键盘：焦点停在禁用的页签上时，方向键移到相邻的启用页签', async () => {
            await render({ items: [...withItem('c', { disabled: true }), { itemKey: 'd', tab: 'D' }, { itemKey: 'e', tab: 'E' }] });
            tab('C').focus();
            await userEvent.keyboard('{ArrowRight}');
            expect(tab('D')).toHaveFocus();
            tab('C').focus();
            await userEvent.keyboard('{ArrowLeft}');
            expect(tab('B')).toHaveFocus();
        });

        test('键盘：RTL 页面中，水平标签栏的左右方向键互换', async () => {
            await render({ direction: 'rtl' });
            tab('A').focus();
            await userEvent.keyboard('{ArrowLeft}');
            expect(tab('B')).toHaveFocus();
            await userEvent.keyboard('{ArrowRight}{ArrowRight}');
            expect(tab('C')).toHaveFocus();
        });

        test('键盘：垂直标签栏使用上下方向键', async () => {
            await render({ tabPosition: 'left' });
            tab('A').focus();
            await userEvent.keyboard('{ArrowRight}');
            expect(tab('A')).toHaveFocus();
            await userEvent.keyboard('{ArrowDown}');
            expect(tab('B')).toHaveFocus();
            await userEvent.keyboard('{ArrowUp}{ArrowUp}');
            expect(tab('C')).toHaveFocus();
        });

        test('按住 Alt、Ctrl 或 Meta 的按键交给浏览器，不移动焦点也不选中', async () => {
            const onChange = vi.fn<NonNullable<TabsSpecProps['onChange']>>();
            await render({ onChange });
            tab('B').focus();
            for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
                for (const key of ['ArrowRight', 'Home', 'Enter']) {
                    const event = new KeyboardEvent('keydown', { key, [modifier]: true, bubbles: true, cancelable: true });
                    expect(tab('B').dispatchEvent(event)).toBe(true);
                    expect(tab('B')).toHaveFocus();
                }
            }
            expect(onChange).not.toHaveBeenCalled();
        });

        test('closable：点击关闭按钮与按 Backspace 调用 onTabClose 而非 onTabClick，焦点移到相邻页签；Delete 不关闭不可关闭的页签', async () => {
            const onTabClose = vi.fn<NonNullable<TabsSpecProps['onTabClose']>>();
            const onTabClick = vi.fn<NonNullable<TabsSpecProps['onTabClick']>>();
            await render({ onTabClose, onTabClick, items: threeItems.map((item) => ({ ...item, closable: item.itemKey !== 'c' })) });
            expect(closeButtons()).toHaveLength(2);
            await userEvent.click(closeButtons()[1]);
            expect(onTabClose).toHaveBeenCalledExactlyOnceWith('b');
            expect(onTabClick).not.toHaveBeenCalled();

            tab('A').focus();
            await userEvent.keyboard('{Backspace}');
            expect(onTabClose).toHaveBeenLastCalledWith('a');
            expect(tab('B')).toHaveFocus();
            tab('C').focus();
            await userEvent.keyboard('{Delete}');
            expect(onTabClose).toHaveBeenCalledTimes(2);
        });

        test('closable：禁用的页签照常显示关闭按钮，点击、Delete 和 Backspace 都不关闭', async () => {
            const onTabClose = vi.fn<NonNullable<TabsSpecProps['onTabClose']>>();
            const onTabClick = vi.fn<NonNullable<TabsSpecProps['onTabClick']>>();
            await render({ onTabClose, onTabClick, items: [threeItems[0], { ...threeItems[1], disabled: true, closable: true }] });
            expect(closeButtons()).toHaveLength(1);
            await userEvent.click(closeButtons()[0]);
            tab('B').focus();
            await userEvent.keyboard('{Delete}');
            await userEvent.keyboard('{Backspace}');
            expect(onTabClose).not.toHaveBeenCalled();
            expect(onTabClick).not.toHaveBeenCalled();
        });

        test('aria-label 落在 role=tablist 的元素上，不在根元素上', async () => {
            await render({ 'aria-label': '设置' });
            expect(view.getByRole('tablist')).toHaveAttribute('aria-label', '设置');
            expect(root()).not.toHaveAttribute('aria-label');
        });

        const apg = (title: string, props: Partial<TabsSpecProps>, options: Partial<CheckOptions> = {}) =>
            test(`APG tabs 模式：${title}`, async () => {
                await render({ items: [...threeItems, { itemKey: 'd', tab: 'D', content: 'content d' }], 'aria-label': 'APG', ...props });
                await expect(checkPattern('tabs', handle.container, { press, ...options })).resolves.toBeUndefined();
            });
        apg('水平 LTR', {});
        apg('水平 RTL', { direction: 'rtl' }, { direction: 'rtl' });
        apg('垂直（tabPosition 为 left）', { tabPosition: 'left' });
        apg('含禁用页签', { items: withItem('b', { disabled: true }, [...threeItems, { itemKey: 'd', tab: 'D', content: 'content d' }]) });
    });
}
