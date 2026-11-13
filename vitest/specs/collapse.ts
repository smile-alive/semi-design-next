import { within, type BoundFunctions, type queries } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { expect, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';
import { checkPattern } from '@test/utils/apg';
import { defineSpec, type SpecHandle, type SpecMount, type SpecOptions } from './shared/define-spec';
import { press } from './shared/press';

export interface CollapseSpecPanel {
    itemKey: string;
    header: string;
    /** Omitted means the panel has no body at all */
    content?: string;
    extra?: string;
    disabled?: boolean;
    showArrow?: boolean;
}

/** Framework-free Collapse props; each fixture turns `panels` into its own children, slots or snippets */
export interface CollapseSpecProps {
    panels: CollapseSpecPanel[];
    /** `undefined` is uncontrolled; `null` and `''` are controlled with nothing open */
    activeKey?: string | string[] | null;
    defaultActiveKey?: string | string[];
    accordion?: boolean;
    clickHeaderToExpand?: boolean;
    expandIconPosition?: 'left' | 'right';
    keepDOM?: boolean;
    lazyRender?: boolean;
    motion?: boolean;
    // React passes a synthetic event, so only `type` is common to every framework
    onChange?: (activeKey: string[], event: { type: string }) => void;
}

const prefix = `${BASE_CLASS_PREFIX}-collapse`;

const threePanels: CollapseSpecPanel[] = [
    { itemKey: '1', header: 'Panel 1', content: 'Body 1' },
    { itemKey: '2', header: 'Panel 2', content: 'Body 2' },
    { itemKey: '3', header: 'Panel 3', content: 'Body 3' },
];

const withPanel = (key: string, patch: Partial<CollapseSpecPanel>) => threePanels.map((panel) => (panel.itemKey === key ? { ...panel, ...patch } : panel));

type ChangeMock = ReturnType<typeof vi.fn<NonNullable<CollapseSpecProps['onChange']>>>;

export function collapseSpec(mount: SpecMount<CollapseSpecProps>, options: SpecOptions = {}) {
    defineSpec('Collapse（共享 spec）', options, (test) => {
        let view: BoundFunctions<typeof queries>;
        let handle: SpecHandle<CollapseSpecProps>;

        // `motion: false` makes closing unmount at once, so jsdom never waits for a transition
        async function render(props: Partial<CollapseSpecProps> = {}) {
            handle = await mount({ panels: threePanels, motion: false, ...props });
            view = within(handle.container);
            return handle;
        }

        const headers = () => view.getAllByRole('button');
        const expanded = () => headers().map((header) => header.getAttribute('aria-expanded') === 'true');
        const rows = () => [...handle.container.querySelectorAll(`.${prefix}-header`)];
        const wrappers = () => handle.container.querySelectorAll(`.${prefix}-content-wrapper`);
        const icons = () => [...handle.container.querySelectorAll(`.${prefix}-header-icon`)];
        const keysOf = (onChange: ChangeMock) => onChange.mock.calls.map(([keys]) => keys);
        const lastKeys = (onChange: ChangeMock) => onChange.mock.lastCall?.[0];
        const regionOf = (header: HTMLElement) => document.getElementById(header.getAttribute('aria-controls') ?? '');

        test('每个标题是三级标题内的原生 button，名称为标题文本；初始全部收起，收起的面板没有 aria-controls', async () => {
            await render();
            const names = headers().map((header) => header.textContent?.trim());
            expect(names).toEqual(['Panel 1', 'Panel 2', 'Panel 3']);
            const levelThree = view.getAllByRole('heading', { level: 3 });
            expect(levelThree).toHaveLength(3);
            headers().forEach((header, i) => {
                expect(header.tagName).toBe('BUTTON');
                expect(header).toHaveAttribute('type', 'button');
                expect(levelThree[i]).toContainElement(header);
                expect(levelThree[i]).toHaveAccessibleName(names[i]);
                expect(header).not.toHaveAttribute('aria-controls');
            });
            expect(expanded()).toEqual([false, false, false]);
        });

        test('defaultActiveKey 接受单个 key 或 key 数组', async () => {
            await render({ defaultActiveKey: '1' });
            expect(expanded()).toEqual([true, false, false]);
            handle.unmount();
            await render({ defaultActiveKey: ['1', '2'] });
            expect(expanded()).toEqual([true, true, false]);
        });

        test('展开的标题用 aria-controls 指向内容，内容是由标题命名的 region', async () => {
            await render();
            await userEvent.click(headers()[1]);
            const region = regionOf(headers()[1]);
            expect(region).toHaveClass(`${prefix}-content`);
            expect(region).toHaveAttribute('role', 'region');
            expect(region).toHaveAttribute('aria-labelledby', headers()[1].id);
            expect(region).toHaveTextContent('Body 2');
            expect(headers()[0]).not.toHaveAttribute('aria-controls');
            expect(headers()[1]).not.toHaveAttribute('aria-owns');
            expect(document.getElementById(headers()[1].id)).toBe(headers()[1]);
        });

        test('非受控：点击切换，可同时展开多个面板，onChange 收到展开的 key 数组和点击事件', async () => {
            const onChange = vi.fn<NonNullable<CollapseSpecProps['onChange']>>();
            await render({ onChange });
            await userEvent.click(headers()[1]);
            expect(onChange).toHaveBeenCalledExactlyOnceWith(['2'], expect.objectContaining({ type: 'click' }));
            await userEvent.click(headers()[2]);
            expect(lastKeys(onChange)).toEqual(['2', '3']);
            expect(expanded()).toEqual([false, true, true]);
            await userEvent.click(headers()[1]);
            expect(lastKeys(onChange)).toEqual(['3']);
            expect(expanded()).toEqual([false, false, true]);
        });

        test('展开状态同步到面板根节点的 semi-collapse-item-active 类名', async () => {
            await render();
            const items = () => [...handle.container.querySelectorAll(`.${prefix}-item`)];
            expect(items()).toHaveLength(3);
            expect(items().map((item) => item.classList.contains(`${prefix}-item-active`))).toEqual([false, false, false]);
            await userEvent.click(headers()[0]);
            expect(items().map((item) => item.classList.contains(`${prefix}-item-active`))).toEqual([true, false, false]);
        });

        test('accordion：同一时刻只展开一个面板，再点击已展开的面板以空数组收起', async () => {
            const onChange = vi.fn<NonNullable<CollapseSpecProps['onChange']>>();
            await render({ accordion: true, defaultActiveKey: '2', onChange });
            expect(expanded()).toEqual([false, true, false]);
            await userEvent.click(headers()[2]);
            expect(lastKeys(onChange)).toEqual(['3']);
            expect(expanded()).toEqual([false, false, true]);
            await userEvent.click(headers()[2]);
            expect(lastKeys(onChange)).toEqual([]);
            expect(expanded()).toEqual([false, false, false]);
        });

        test('受控：点击只报告新的 key 数组，展开状态由 activeKey 决定，且优先于 defaultActiveKey', async () => {
            const onChange = vi.fn<NonNullable<CollapseSpecProps['onChange']>>();
            await render({ activeKey: '1', defaultActiveKey: '3', onChange });
            expect(expanded()).toEqual([true, false, false]);
            await userEvent.click(headers()[1]);
            expect(lastKeys(onChange)).toEqual(['1', '2']);
            expect(expanded()).toEqual([true, false, false]);

            await handle.update({ activeKey: ['2', '3'] });
            expect(expanded()).toEqual([false, true, true]);
            await userEvent.click(headers()[2]);
            expect(lastKeys(onChange)).toEqual(['2']);
            expect(expanded()).toEqual([false, true, true]);

            await handle.update({ activeKey: [] });
            expect(expanded()).toEqual([false, false, false]);
        });

        test("activeKey 为 '' 或 null 是受控的空值：收起全部面板，点击只报告", async () => {
            const onChange = vi.fn<NonNullable<CollapseSpecProps['onChange']>>();
            await render({ activeKey: ['2'], onChange });
            for (const activeKey of ['', null]) {
                await handle.update({ activeKey: ['2'] });
                expect(expanded()).toEqual([false, true, false]);
                await handle.update({ activeKey });
                expect(expanded()).toEqual([false, false, false]);
                await userEvent.click(headers()[0]);
                expect(lastKeys(onChange)).toEqual(['1']);
                expect(expanded()).toEqual([false, false, false]);
            }
        });

        test('activeKey 改回 undefined 后转为非受控，从最后的受控值继续', async () => {
            const onChange = vi.fn<NonNullable<CollapseSpecProps['onChange']>>();
            await render({ activeKey: ['1'], onChange });
            await handle.update({ activeKey: ['3'] });
            await handle.update({ activeKey: undefined });
            expect(expanded()).toEqual([false, false, true]);
            await userEvent.click(headers()[1]);
            expect(lastKeys(onChange)).toEqual(['3', '2']);
            expect(expanded()).toEqual([false, true, true]);
        });

        test("最后的受控值是 '' 时，activeKey 改回 undefined 后保持全部收起，点击即展开", async () => {
            const onChange = vi.fn<NonNullable<CollapseSpecProps['onChange']>>();
            await render({ activeKey: ['2'], onChange });
            await handle.update({ activeKey: '' });
            await handle.update({ activeKey: undefined });
            expect(expanded()).toEqual([false, false, false]);
            await userEvent.click(headers()[0]);
            expect(lastKeys(onChange)).toEqual(['1']);
            expect(expanded()).toEqual([true, false, false]);
        });

        test('禁用面板：标题是禁用的 button，点击不切换也不调用 onChange，展开图标为禁用态', async () => {
            const onChange = vi.fn<NonNullable<CollapseSpecProps['onChange']>>();
            await render({ onChange, panels: withPanel('1', { disabled: true }) });
            expect(rows()[0]).toHaveClass(`${prefix}-header-disabled`);
            expect(rows()[1]).not.toHaveClass(`${prefix}-header-disabled`);
            expect(headers()[0]).toBeDisabled();
            expect(headers()[1]).toBeEnabled();
            expect(icons()[0]).toHaveClass(`${prefix}-header-iconDisabled`);
            expect(icons()[1]).not.toHaveClass(`${prefix}-header-iconDisabled`);
            await userEvent.click(headers()[0]);
            expect(onChange).not.toHaveBeenCalled();
            expect(expanded()).toEqual([false, false, false]);
        });

        test('键盘：Tab 跳过禁用面板，Enter 与 Space 切换聚焦的面板，onChange 收到 click 事件', async () => {
            const onChange = vi.fn<NonNullable<CollapseSpecProps['onChange']>>();
            await render({ onChange, panels: withPanel('2', { disabled: true }) });
            await userEvent.tab();
            expect(headers()[0]).toHaveFocus();
            await userEvent.keyboard('{Enter}');
            expect(expanded()).toEqual([true, false, false]);
            await userEvent.tab();
            expect(headers()[2]).toHaveFocus();
            await userEvent.keyboard(' ');
            expect(expanded()).toEqual([true, false, true]);
            await userEvent.keyboard(' ');
            expect(expanded()).toEqual([true, false, false]);
            expect(keysOf(onChange)).toEqual([['1'], ['1', '3'], ['1']]);
            expect(onChange).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ type: 'click' }));
        });

        test('clickHeaderToExpand 为 false：点击整行和 extra 不切换，点击标题按钮或展开图标才切换，键盘仍可切换', async () => {
            const onChange = vi.fn<NonNullable<CollapseSpecProps['onChange']>>();
            await render({ clickHeaderToExpand: false, onChange, panels: withPanel('1', { extra: 'more' }) });
            await userEvent.click(view.getByText('more'));
            await userEvent.click(rows()[0]);
            expect(onChange).not.toHaveBeenCalled();
            expect(expanded()).toEqual([false, false, false]);

            await userEvent.click(icons()[0]);
            expect(lastKeys(onChange)).toEqual(['1']);
            await userEvent.click(view.getByText('Panel 2'));
            expect(lastKeys(onChange)).toEqual(['1', '2']);
            expect(expanded()).toEqual([true, true, false]);

            headers()[2].focus();
            await userEvent.keyboard('{Enter}');
            expect(expanded()).toEqual([true, true, true]);
        });

        test('clickHeaderToExpand 默认开启：点击整行（包括 extra）都切换', async () => {
            const onChange = vi.fn<NonNullable<CollapseSpecProps['onChange']>>();
            await render({ onChange, panels: withPanel('1', { extra: 'more' }) });
            await userEvent.click(view.getByText('more'));
            expect(expanded()).toEqual([true, false, false]);
            await userEvent.click(rows()[0]);
            expect(expanded()).toEqual([false, false, false]);
            expect(onChange).toHaveBeenCalledTimes(2);
        });

        test('extra 渲染在标题按钮之外的 header-right 里，不计入按钮的名称', async () => {
            await render({ panels: withPanel('1', { extra: 'more' }) });
            const right = rows()[0].querySelector(`.${prefix}-header-right`);
            expect(right).toHaveTextContent('more');
            expect(headers()[0]).not.toContainElement(right as HTMLElement);
            expect(headers()[0]).toHaveAccessibleName('Panel 1');
            expect(rows()[1].querySelector(`.${prefix}-header-right`)?.textContent ?? '').not.toContain('more');
        });

        test('expandIconPosition 为 left 时图标在标题之前，为 right（默认）时在 header-right 的末尾', async () => {
            await render({ panels: withPanel('1', { extra: 'more' }) });
            const right = rows()[0].querySelector(`.${prefix}-header-right`);
            expect(rows()[0]).not.toHaveClass(`${prefix}-header-iconLeft`);
            expect(right?.lastElementChild).toHaveClass(`${prefix}-header-icon`);

            await handle.update({ expandIconPosition: 'left' });
            expect(rows()[0]).toHaveClass(`${prefix}-header-iconLeft`);
            expect(rows()[0].firstElementChild).toHaveClass(`${prefix}-header-icon`);
            expect(handle.container.querySelectorAll(`.${prefix}-header-right .${prefix}-header-icon`)).toHaveLength(0);
        });

        test('showArrow 为 false 的面板不渲染展开图标', async () => {
            await render({ panels: withPanel('1', { showArrow: false }) });
            expect(icons()).toHaveLength(2);
            expect(rows()[0].querySelector(`.${prefix}-header-icon`)).toBeNull();
        });

        test('默认收起的内容被卸载；keepDOM 保留全部内容，收起的内容 inert 且仍被 aria-controls 指向', async () => {
            await render({ defaultActiveKey: '1' });
            expect(wrappers()).toHaveLength(1);
            await userEvent.click(headers()[0]);
            expect(wrappers()).toHaveLength(0);
            expect(headers()[0]).not.toHaveAttribute('aria-controls');
            handle.unmount();

            await render({ keepDOM: true });
            expect(wrappers()).toHaveLength(3);
            headers().forEach((header) => expect(regionOf(header)).not.toBeNull());
            const region = regionOf(headers()[0]) as HTMLElement & { inert?: boolean };
            expect(region).toHaveClass(`${prefix}-content`);
            expect(region.inert === true || region.hasAttribute('inert')).toBe(true);
            expect(region).not.toHaveAttribute('aria-hidden');
            await userEvent.click(headers()[0]);
            expect(region.inert === true || region.hasAttribute('inert')).toBe(false);
        });

        test('keepDOM 加 lazyRender：首次展开时才挂载内容，收起后保留并仍被 aria-controls 指向', async () => {
            await render({ keepDOM: true, lazyRender: true });
            expect(wrappers()).toHaveLength(0);
            headers().forEach((header) => expect(header).not.toHaveAttribute('aria-controls'));
            await userEvent.click(headers()[1]);
            expect(wrappers()).toHaveLength(1);
            await userEvent.click(headers()[1]);
            expect(expanded()).toEqual([false, false, false]);
            expect(wrappers()).toHaveLength(1);
            expect(regionOf(headers()[1])).toHaveClass(`${prefix}-content`);
            expect(headers()[2]).not.toHaveAttribute('aria-controls');
        });

        test('没有内容的面板：无内容区和 aria-controls，展开图标为禁用态，但仍可切换', async () => {
            const onChange = vi.fn<NonNullable<CollapseSpecProps['onChange']>>();
            await render({ onChange, panels: withPanel('1', { content: undefined }) });
            expect(icons()[0]).toHaveClass(`${prefix}-header-iconDisabled`);
            expect(icons()[1]).not.toHaveClass(`${prefix}-header-iconDisabled`);
            await userEvent.click(headers()[0]);
            expect(lastKeys(onChange)).toEqual(['1']);
            expect(expanded()).toEqual([true, false, false]);
            expect(headers()[0]).not.toHaveAttribute('aria-controls');
            expect(handle.container.querySelectorAll(`.${prefix}-content`)).toHaveLength(0);
            expect(icons()[0]).toHaveClass(`${prefix}-header-iconDisabled`);
        });

        test('每个面板的 aria-controls 和标题 id 各自唯一', async () => {
            await render({ keepDOM: true });
            const controls = headers().map((header) => header.getAttribute('aria-controls'));
            expect(new Set(controls).size).toBe(3);
            expect(new Set(headers().map((header) => header.id)).size).toBe(3);
            controls.forEach((id) => expect(document.getElementById(id ?? '')).toHaveClass(`${prefix}-content`));
        });

        const apg = (name: string, props: Partial<CollapseSpecProps>) =>
            test(`APG accordion：${name}`, async () => {
                await render(props);
                await expect(checkPattern('accordion', handle.container, { press })).resolves.toBeUndefined();
            });
        apg('默认', {});
        apg('含禁用面板', { panels: withPanel('2', { disabled: true }) });
        apg('accordion 模式', { accordion: true, defaultActiveKey: '1' });
        apg('keepDOM', { keepDOM: true });
    });
}
