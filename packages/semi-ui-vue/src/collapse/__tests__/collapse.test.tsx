/** @jsxImportSource vue */
import { nextTick, shallowRef, type ComponentPublicInstance } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { IconCopy, IconMinus, IconPlus } from '@fibrae/semi-icons-vue';
import { render } from '@test/utils/vue';
import Collapse, { CollapsePanel } from '..';
import semiGlobal, { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import type { CollapseEmits } from '../interface';
import Model from './fixtures/model.vue';
import OptionalContent from './fixtures/optional-content.vue';
import Panels from './fixtures/panels.vue';
import ToggledContent from './fixtures/toggled-content.vue';

type Change = (...args: CollapseEmits['change']) => void;
const prefixCls = `${BASE_CLASS_PREFIX}-collapse`;

// attrs reach Collapse (activeKey, onChange, ...); panel carries the first panel's disabled, extra and attrs
const renderPanels = (attrs: Record<string, unknown> = {}, panel: { disabled?: boolean; extra?: string; panelAttrs?: Record<string, unknown> } = {}, slots = {}) => render(Panels, { props: panel, attrs, slots });

const getHeaders = () => screen.getAllByRole('button');
const getRows = (container: Element) => [...container.querySelectorAll<HTMLElement>(`.${prefixCls}-header`)];
const expectExpanded = (expected: boolean[]) => expect(getHeaders().map((header) => header.getAttribute('aria-expanded'))).toEqual(expected.map(String));
const panelBody = (text: string) => ({ default: () => <p>{text}</p> });

describe('Collapse', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('Collapse 自定义 class 与 style', () => {
        const { container } = renderPanels({ class: 'test', style: { color: 'red' } });
        const collapse = container.querySelector(`.${prefixCls}`);
        expect(collapse).toHaveClass('test');
        expect(collapse).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('Collapse 使用 defaultActiveKey', () => {
        const first = renderPanels({ defaultActiveKey: '1' });
        expectExpanded([true, false, false]);
        first.unmount();
        renderPanels({ defaultActiveKey: ['1', '2'] });
        expectExpanded([true, true, false]);
    });

    it('Collapse 自定义 expandIcon 与 collapseIcon 插槽', async () => {
        const { container } = renderPanels({}, {}, { expandIcon: () => <IconPlus />, collapseIcon: () => <IconMinus /> });
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-plus`)).toHaveLength(3);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-icon-minus`)).toBeNull();
        await userEvent.click(getHeaders()[0]);
        expect(getRows(container)[0].querySelector(`.${BASE_CLASS_PREFIX}-icon-minus`)).not.toBeNull();
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-plus`)).toHaveLength(2);
    });

    it('默认图标：收起态向下，展开态向上', async () => {
        const { container } = renderPanels();
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-chevron_down`)).toHaveLength(3);
        await userEvent.click(getHeaders()[0]);
        expect(getRows(container)[0].querySelector(`.${BASE_CLASS_PREFIX}-icon-chevron_up`)).not.toBeNull();
    });

    it('Collapse 自定义 extra 内容', () => {
        const { container } = render(() => (
            <Collapse>
                {() => (
                    <>
                        <CollapsePanel itemKey="1">{{ header: () => 'This is panel header 1', extra: () => '1234', ...panelBody('a') }}</CollapsePanel>
                        <CollapsePanel itemKey="2">
                            {{
                                header: () => 'This is panel header 2',
                                extra: () => <IconCopy />,
                                ...panelBody('b'),
                            }}
                        </CollapsePanel>
                    </>
                )}
            </Collapse>
        ));
        const [panel1, panel2] = container.querySelectorAll(`.${prefixCls}-header-right`);
        expect(panel1).toHaveTextContent('1234');
        expect(panel2.querySelector(`.${BASE_CLASS_PREFIX}-icon-copy`)).not.toBeNull();
    });

    it('change 事件的载荷是 activeKey 数组与点击事件', async () => {
        const change = vi.fn<Change>();
        renderPanels({ onChange: change });
        await userEvent.click(getHeaders()[2]);
        expect(change).toHaveBeenCalledTimes(1);
        expect(change).toHaveBeenCalledWith(['3'], expect.any(MouseEvent));
    });

    it('可同时展开多个面板', async () => {
        const change = vi.fn<Change>();
        renderPanels({ onChange: change });
        await userEvent.click(getHeaders()[1]);
        await userEvent.click(getHeaders()[2]);
        expect(change).toHaveBeenLastCalledWith(['2', '3'], expect.any(MouseEvent));
        expectExpanded([false, true, true]);
    });

    it('手风琴模式只允许展开一个面板', async () => {
        const change = vi.fn<Change>();
        renderPanels({ accordion: true, defaultActiveKey: ['1', '2'], onChange: change });
        expectExpanded([true, false, false]);
        await userEvent.click(getHeaders()[2]);
        expect(change).toHaveBeenCalledWith(['3'], expect.any(MouseEvent));
        expectExpanded([false, false, true]);
    });

    it('禁用面板', () => {
        const { container } = renderPanels({}, { disabled: true });
        const rows = getRows(container);
        expect(rows[0]).toHaveClass(`${prefixCls}-header-disabled`);
        expect(getHeaders()[0]).toBeDisabled();
        expect(rows[1]).not.toHaveClass(`${prefixCls}-header-disabled`);
        expect(getHeaders()[1]).toBeEnabled();
    });

    it('每个标题是原生 button，名称为标题文本，位于三级标题内', () => {
        renderPanels();
        const headings = screen.getAllByRole('heading', { level: 3 });
        expect(headings).toHaveLength(3);
        const button = screen.getByRole('button', { name: 'This is panel header 1' });
        expect(button.tagName).toBe('BUTTON');
        expect(button).toHaveAttribute('type', 'button');
        expect(headings[0]).toContainElement(button);
        expect(headings[0]).toHaveAccessibleName('This is panel header 1');
    });

    it('extra 与切换按钮并列，其自身的 button 不嵌套在切换按钮内', async () => {
        const change = vi.fn<Change>();
        render(() => (
            <Collapse clickHeaderToExpand={false} onChange={change}>
                {() => (
                    <CollapsePanel itemKey="1">
                        {{
                            header: () => 'title',
                            extra: () => <button type="button">copy</button>,
                            default: () => 'content',
                        }}
                    </CollapsePanel>
                )}
            </Collapse>
        ));
        const toggle = screen.getByRole('button', { name: 'title' });
        const copy = screen.getByRole('button', { name: 'copy' });
        expect(toggle).not.toContainElement(copy);
        expect(screen.getByRole('heading')).not.toContainElement(copy);
        await userEvent.click(copy);
        expect(change).not.toHaveBeenCalled();
    });

    it('隐藏面板图标', () => {
        const { container } = renderPanels({}, { panelAttrs: { showArrow: false } });
        expect(container.querySelectorAll(`.${prefixCls}-header-icon`)).toHaveLength(2);
        expect(getRows(container)[0].querySelector(`.${prefixCls}-header-icon`)).toBeNull();
    });

    it('生成的面板 id 是合法的 CSS id 选择器', async () => {
        renderPanels({ motion: false });
        await userEvent.click(getHeaders()[1]);
        const id = getHeaders()[1].getAttribute('aria-controls') as string;
        expect(document.querySelector(`#${id}`)).toHaveTextContent('Hi, bytedance dance dance.');
    });

    it('受控 activeKey 只通过 props 变化', async () => {
        const change = vi.fn<Change>();
        const view = renderPanels({ activeKey: '1', onChange: change });
        expectExpanded([true, false, false]);
        await userEvent.click(getHeaders()[1]);
        expect(change).toHaveBeenLastCalledWith(['1', '2'], expect.any(MouseEvent));
        expectExpanded([true, false, false]);
        await view.rerender({ activeKey: ['2', '3'] });
        expectExpanded([false, true, true]);
        await userEvent.click(getHeaders()[2]);
        expect(change).toHaveBeenLastCalledWith(['2'], expect.any(MouseEvent));
        await view.rerender({ activeKey: [] });
        expectExpanded([false, false, false]);
    });

    it('单向绑定 activeKey 与 change，点击后面板不自行翻转', async () => {
        const change = vi.fn<Change>();
        renderPanels({ activeKey: ['1'], onChange: change });
        await userEvent.click(getHeaders()[0]);
        expect(change).toHaveBeenCalledWith([], expect.any(MouseEvent));
        expectExpanded([true, false, false]);
    });

    it('父级以新数组传入相同的 activeKey 不改变面板', async () => {
        const view = renderPanels({ activeKey: ['2'] });
        await view.rerender({ activeKey: ['2'] });
        expectExpanded([false, true, false]);
    });

    it('activeKey 优先于 defaultActiveKey', () => {
        renderPanels({ activeKey: ['2'], defaultActiveKey: ['1'] });
        expectExpanded([false, true, false]);
    });

    it("'' 与 null 的 activeKey 是受控的空值，收起全部面板", async () => {
        const change = vi.fn<Change>();
        const view = renderPanels({ activeKey: ['2'], onChange: change });
        for (const activeKey of ['', null]) {
            await view.rerender({ activeKey: ['2'] });
            expectExpanded([false, true, false]);
            await view.rerender({ activeKey });
            expectExpanded([false, false, false]);
            // still controlled: a click only reports, without the empty value in the keys
            await userEvent.click(getHeaders()[0]);
            expect(change).toHaveBeenLastCalledWith(['1'], expect.any(MouseEvent));
            expectExpanded([false, false, false]);
        }
    });

    it('activeKey 变回 undefined 后转为非受控，从最后的受控值继续', async () => {
        const change = vi.fn<Change>();
        const view = renderPanels({ activeKey: ['2'], onChange: change });
        await view.rerender({ activeKey: '' });
        await view.rerender({ activeKey: undefined });
        expectExpanded([false, false, false]);
        await userEvent.click(getHeaders()[0]);
        expect(change).toHaveBeenLastCalledWith(['1'], expect.any(MouseEvent));
        expectExpanded([true, false, false]);
    });

    it('转为非受控后，从上次受控的 activeKey 继续', async () => {
        const change = vi.fn<Change>();
        const view = renderPanels({ activeKey: ['1'], onChange: change });
        await view.rerender({ activeKey: ['3'] });
        await view.rerender({ activeKey: undefined });
        expectExpanded([false, false, true]);
        await userEvent.click(getHeaders()[1]);
        expect(change).toHaveBeenLastCalledWith(['3', '2'], expect.any(MouseEvent));
        expectExpanded([false, true, true]);
    });

    it('v-model:activeKey 双向绑定：点击写回父值，父值改变面板跟随', async () => {
        render(Model);
        const model = () => screen.getByLabelText('model');
        expect(model()).toHaveTextContent('"1"');
        await userEvent.click(screen.getByRole('button', { name: 'two' }));
        expect(model()).toHaveTextContent('["1","2"]');
        expect(screen.getByLabelText('changes')).toHaveTextContent('1');
        await userEvent.click(screen.getByRole('button', { name: 'set two' }));
        expect(screen.getByRole('button', { name: 'one' })).toHaveAttribute('aria-expanded', 'false');
        expect(screen.getByRole('button', { name: 'two' })).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByLabelText('changes')).toHaveTextContent('1');
    });

    it('一次点击 update:activeKey 与 change 各发一次，载荷相同', async () => {
        const update = vi.fn<(activeKey: string[]) => void>();
        const change = vi.fn<Change>();
        renderPanels({ 'onUpdate:activeKey': update, onChange: change });
        await userEvent.click(getHeaders()[0]);
        expect(update).toHaveBeenCalledTimes(1);
        expect(change).toHaveBeenCalledTimes(1);
        expect(update.mock.calls[0][0]).toEqual(change.mock.calls[0][0]);
        expect(change.mock.calls[0][1]).toBeInstanceOf(MouseEvent);
    });

    it('模板 ref 的 $el 指向根元素与面板元素', () => {
        const root = shallowRef<ComponentPublicInstance | null>(null);
        const panel = shallowRef<ComponentPublicInstance | null>(null);
        const { container } = render(() => (
            <Collapse ref={root}>
                {() => (
                    <CollapsePanel ref={panel} itemKey="1">
                        {{ header: () => '1', default: () => 'content' }}
                    </CollapsePanel>
                )}
            </Collapse>
        ));
        expect(root.value?.$el).toBe(container.querySelector(`.${prefixCls}`));
        expect(panel.value?.$el).toBe(container.querySelector(`.${prefixCls}-item`));
    });

    it('首次渲染时标题的 aria-controls 指向内容 id，且每个面板唯一', () => {
        renderPanels({ keepDOM: true, motion: false });
        const ids = getHeaders().map((header) => header.getAttribute('aria-controls') as string);
        expect(new Set(ids).size).toBe(3);
        ids.forEach((id) => {
            expect(id).toMatch(new RegExp(`^${prefixCls}-`));
            expect(document.getElementById(id)).toHaveClass(`${prefixCls}-content`);
        });
    });

    it('keepDOM 下关闭面板的内容设为 inert 而非 aria-hidden', () => {
        renderPanels({ keepDOM: true, motion: false });
        const region = document.getElementById(getHeaders()[0].getAttribute('aria-controls') as string);
        expect(region).toHaveAttribute('inert');
        expect(region).not.toHaveAttribute('aria-hidden');
    });

    it('未知属性传到根元素', () => {
        const { container } = renderPanels({ 'aria-label': 'faq', id: 'faq' });
        const root = container.querySelector(`.${prefixCls}`);
        expect(root).toHaveAttribute('aria-label', 'faq');
        expect(root).toHaveAttribute('id', 'faq');
    });

    it('motionEnd 是声明的事件，不落到面板根元素', async () => {
        const motionEnd = vi.fn<() => void>();
        const { container } = renderPanels({ defaultActiveKey: '1' }, { panelAttrs: { onMotionEnd: motionEnd } });
        const item = container.querySelector(`.${prefixCls}-item`) as HTMLElement;
        expect(item).not.toHaveAttribute('onmotionend');
        expect(item).not.toHaveAttribute('motionend');
        const wrapper = item.querySelector('.semi-collapsible-wrapper') as HTMLElement;
        await userEvent.click(getHeaders()[0]);
        await fireEvent.transitionEnd(wrapper, { propertyName: 'height' });
        expect(motionEnd).toHaveBeenCalledTimes(1);
    });

    it('受控手风琴展示传入的所有 key，并能从这些 key 切换', async () => {
        const change = vi.fn<Change>();
        renderPanels({ accordion: true, activeKey: ['1', '2'], onChange: change });
        expectExpanded([true, true, false]);
        await userEvent.click(getHeaders()[1]);
        expect(change).toHaveBeenLastCalledWith(['1'], expect.any(MouseEvent));
    });

    it('手风琴关闭已展开面板，并以数组形式通知', async () => {
        const change = vi.fn<Change>();
        renderPanels({ accordion: true, defaultActiveKey: '2', onChange: change });
        expectExpanded([false, true, false]);
        await userEvent.click(getHeaders()[1]);
        expect(change).toHaveBeenLastCalledWith([], expect.any(MouseEvent));
        expectExpanded([false, false, false]);
    });

    it('change 接收点击事件', async () => {
        const change = vi.fn<Change>();
        renderPanels({ onChange: change });
        await userEvent.click(getHeaders()[0]);
        expect(change.mock.calls[0][1].type).toBe('click');
        expect(change.mock.calls[0][1].target).toBe(getHeaders()[0]);
    });

    it.each(['none', 'comment'] as const)('默认插槽为 %s 的展开面板没有内容，标题无 aria-controls 且图标禁用', (variant) => {
        const { container } = render(OptionalContent, { props: { variant } });
        expect(container.querySelector(`.${prefixCls}-content`)).toBeNull();
        expect(getHeaders()[0]).not.toHaveAttribute('aria-controls');
        expect(container.querySelector(`.${prefixCls}-header-icon`)).toHaveClass(`${prefixCls}-header-iconDisabled`);
    });

    it('禁用面板忽略点击，展开图标显示为禁用态', async () => {
        const change = vi.fn<Change>();
        const { container } = renderPanels({ onChange: change }, { disabled: true });
        await userEvent.click(getHeaders()[0]);
        expect(change).not.toHaveBeenCalled();
        expectExpanded([false, false, false]);
        const icons = container.querySelectorAll(`.${prefixCls}-header-icon`);
        expect(icons[0]).toHaveClass(`${prefixCls}-header-iconDisabled`);
        expect(icons[1]).not.toHaveClass(`${prefixCls}-header-iconDisabled`);
    });

    it('没有默认插槽的面板图标禁用、无内容，但仍可切换', async () => {
        const change = vi.fn<Change>();
        const { container } = render(() => <Collapse onChange={change}>{() => <CollapsePanel itemKey="1">{{ header: () => 'empty' }}</CollapsePanel>}</Collapse>);
        const icon = () => container.querySelector(`.${prefixCls}-header-icon`);
        expect(icon()).toHaveClass(`${prefixCls}-header-iconDisabled`);
        expect(container.querySelector(`.${prefixCls}-content`)).toBeNull();
        await userEvent.click(getHeaders()[0]);
        expect(change).toHaveBeenCalledWith(['1'], expect.any(MouseEvent));
        expect(icon()).toHaveClass(`${prefixCls}-header-iconDisabled`);
    });

    it('expandIconPosition 为 left 时图标位于标题文本之前', () => {
        const { container } = renderPanels({ expandIconPosition: 'left' });
        const row = getRows(container)[0];
        expect(row).toHaveClass(`${prefixCls}-header-iconLeft`);
        expect(row.firstElementChild).toHaveClass(`${prefixCls}-header-icon`);
        expect(container.querySelectorAll(`.${prefixCls}-header-right .${prefixCls}-header-icon`)).toHaveLength(0);
    });

    it('clickHeaderToExpand 为 false 时，切换 expandIconPosition 后点击图标仍能切换', async () => {
        const change = vi.fn<Change>();
        const view = renderPanels({ clickHeaderToExpand: false, onChange: change });
        await view.rerender({ expandIconPosition: 'left' });
        const icon = view.container.querySelector(`.${prefixCls}-header-icon`) as HTMLElement;
        await userEvent.click(icon);
        expect(change).toHaveBeenCalledTimes(1);
        expect(change.mock.calls[0][0]).toEqual(['1']);
    });

    it('expandIconPosition 为 right 时图标位于 extra 之后', () => {
        const { container } = renderPanels({}, { extra: 'more' });
        const row = getRows(container)[0];
        const right = row.querySelector(`.${prefixCls}-header-right`) as HTMLElement;
        expect(right).toHaveTextContent('more');
        expect(right.lastElementChild).toHaveClass(`${prefixCls}-header-icon`);
        expect(row).not.toHaveClass(`${prefixCls}-header-iconLeft`);
    });

    it('元素标题原样放入切换按钮，extra 并列其旁', () => {
        const { container } = render(() => (
            <Collapse expandIconPosition="left">
                {() => (
                    <>
                        <CollapsePanel itemKey="1">
                            {{
                                header: () => <b data-testid="node">node header</b>,
                                extra: () => 'more',
                                default: () => 'content',
                            }}
                        </CollapsePanel>
                        <CollapsePanel itemKey="2">
                            {{
                                header: () => <b>no extra</b>,
                                default: () => 'content',
                            }}
                        </CollapsePanel>
                        <CollapsePanel itemKey="3">{{ header: () => 'text', default: () => 'content' }}</CollapsePanel>
                    </>
                )}
            </Collapse>
        ));
        const [row, plainRow, textRow] = getRows(container);
        expect(row.firstElementChild).toHaveClass(`${prefixCls}-header-icon`);
        expect(getHeaders()[0].firstElementChild).toBe(screen.getByTestId('node'));
        expect(getHeaders()[0]).toHaveAccessibleName('node header');
        expect(row.querySelector(`.${prefixCls}-header-right`)).toHaveTextContent('more');
        expect(plainRow.querySelector(`.${prefixCls}-header-right`)).toBeNull();
        expect(textRow.querySelector(`.${prefixCls}-header-right`)).not.toBeNull();
    });

    it('元素标题的 #extra 只有空文本时不渲染 header-right', () => {
        const { container } = render(() => (
            <Collapse>
                {() => (
                    <CollapsePanel itemKey="1">
                        {{
                            header: () => <b>title</b>,
                            extra: () => '',
                            default: () => 'content',
                        }}
                    </CollapsePanel>
                )}
            </Collapse>
        ));
        expect(container.querySelector(`.${prefixCls}-header-right`)).toBeNull();
    });

    it('文本标题没有 extra 时仍渲染 header-right 与其中的空 span', () => {
        const { container } = renderPanels();
        const right = getRows(container)[1].querySelector(`.${prefixCls}-header-right`) as HTMLElement;
        expect(right.firstElementChild?.tagName).toBe('SPAN');
        expect(right.firstElementChild).toHaveTextContent('');
        expect(right.firstElementChild?.children).toHaveLength(0);
        expect(right.lastElementChild).toHaveClass(`${prefixCls}-header-icon`);
    });

    it('expandIcon 插槽为空时不显示图标，图标容器仍在', () => {
        const { container } = renderPanels({}, {}, { expandIcon: () => [] });
        const icon = container.querySelector(`.${prefixCls}-header-icon`) as HTMLElement;
        expect(icon).not.toBeNull();
        expect(icon.children).toHaveLength(0);
    });

    it('clickHeaderToExpand 为 false 时仅点击按钮与图标切换，不响应整行点击', async () => {
        const change = vi.fn<Change>();
        const { container } = renderPanels({ clickHeaderToExpand: false, onChange: change }, { extra: 'more' });
        await userEvent.click(screen.getByText('more'));
        await userEvent.click(getRows(container)[0]);
        expect(change).not.toHaveBeenCalled();
        expectExpanded([false, false, false]);
        await userEvent.click(container.querySelector(`.${prefixCls}-header-icon`) as HTMLElement);
        expect(change).toHaveBeenLastCalledWith(['1'], expect.any(MouseEvent));
        expectExpanded([true, false, false]);
        await userEvent.click(screen.getByText('This is panel header 2'));
        expect(change).toHaveBeenLastCalledWith(['1', '2'], expect.any(MouseEvent));
        expectExpanded([true, true, false]);
    });

    it('clickHeaderToExpand 为 true 时点击整行（包括 extra）均可切换', async () => {
        const change = vi.fn<Change>();
        const { container } = renderPanels({ onChange: change }, { extra: 'more' });
        await userEvent.click(screen.getByText('more'));
        expectExpanded([true, false, false]);
        await userEvent.click(getRows(container)[0]);
        expectExpanded([false, false, false]);
        expect(change).toHaveBeenCalledTimes(2);
    });

    it('未设置 keepDOM 时，折叠内容会被卸载', async () => {
        const first = renderPanels({ motion: false, defaultActiveKey: '1' });
        expect(first.container.querySelectorAll(`.${prefixCls}-content-wrapper`)).toHaveLength(1);
        await userEvent.click(getHeaders()[0]);
        expect(first.container.querySelectorAll(`.${prefixCls}-content-wrapper`)).toHaveLength(0);
        first.unmount();

        const kept = renderPanels({ motion: false, keepDOM: true });
        expect(kept.container.querySelectorAll(`.${prefixCls}-content-wrapper`)).toHaveLength(3);
    });

    it('keepDOM 与 lazyRender 同时使用时，内容首次展开后挂载并保留', async () => {
        const { container } = renderPanels({ motion: false, keepDOM: true, lazyRender: true });
        expect(container.querySelectorAll(`.${prefixCls}-content-wrapper`)).toHaveLength(0);
        await userEvent.click(getHeaders()[1]);
        expect(container.querySelectorAll(`.${prefixCls}-content-wrapper`)).toHaveLength(1);
        await userEvent.click(getHeaders()[1]);
        expectExpanded([false, false, false]);
        expect(container.querySelectorAll(`.${prefixCls}-content-wrapper`)).toHaveLength(1);
    });

    it('内容与标题携带展开状态', async () => {
        const { container } = renderPanels({ motion: false, keepDOM: true });
        const items = container.querySelectorAll(`.${prefixCls}-item`);
        expect(items[0]).not.toHaveClass(`${prefixCls}-item-active`);
        expect(items[0].querySelector(`.${prefixCls}-content`)).toHaveAttribute('inert');
        await userEvent.click(getHeaders()[0]);
        expect(items[0]).toHaveClass(`${prefixCls}-item-active`);
        expect(items[0].querySelector(`.${prefixCls}-content`)).not.toHaveAttribute('inert');
    });

    it('标题获得焦点后，Enter 与 Space 切换面板', async () => {
        const change = vi.fn<Change>();
        renderPanels({ onChange: change });
        getHeaders()[0].focus();
        await userEvent.keyboard('{Enter}');
        expectExpanded([true, false, false]);
        await userEvent.keyboard(' ');
        expectExpanded([false, false, false]);
        expect(change).toHaveBeenCalledTimes(2);
        expect(change.mock.calls[0][0]).toEqual(['1']);
    });

    it('即使 clickHeaderToExpand 为 false，键盘仍可切换；Tab 跳过禁用面板', async () => {
        render(() => (
            <Collapse clickHeaderToExpand={false}>
                {() => (
                    <>
                        <CollapsePanel itemKey="1">{{ header: () => 'a', default: () => 'one' }}</CollapsePanel>
                        <CollapsePanel itemKey="2" disabled>
                            {{ header: () => 'b', default: () => 'two' }}
                        </CollapsePanel>
                        <CollapsePanel itemKey="3">{{ header: () => 'c', default: () => 'three' }}</CollapsePanel>
                    </>
                )}
            </Collapse>
        ));
        await userEvent.tab();
        expect(getHeaders()[0]).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        expectExpanded([true, false, false]);
        await userEvent.tab();
        expect(getHeaders()[2]).toHaveFocus();
        await userEvent.keyboard(' ');
        expectExpanded([true, false, true]);
    });

    it('extra 内 input 中的 Enter 与 Space 不切换面板', async () => {
        render(() => (
            <Collapse>
                {() => (
                    <CollapsePanel itemKey="1">
                        {{
                            header: () => 'title',
                            extra: () => <input aria-label="inner" />,
                            default: () => 'one',
                        }}
                    </CollapsePanel>
                )}
            </Collapse>
        ));
        screen.getByLabelText('inner').focus();
        await userEvent.keyboard('{Enter} ');
        expectExpanded([false]);
    });

    it('标题控制内容，内容为由标题命名的 region', async () => {
        const { container } = renderPanels({ motion: false });
        const [header] = getHeaders();
        // collapsed without keepDOM: no content in the DOM, so no dangling aria-controls
        expect(header).not.toHaveAttribute('aria-controls');
        await userEvent.click(header);
        const region = document.getElementById(header.getAttribute('aria-controls') as string);
        expect(region).toHaveClass(`${prefixCls}-content`);
        expect(region).toHaveAttribute('role', 'region');
        expect(region).toHaveAttribute('aria-labelledby', header.id);
        expect(header).not.toHaveAttribute('aria-owns');
        expect(container.querySelector(`#${header.id}`)).toBe(header);
    });

    it('keepDOM 保留关闭内容时存在 aria-controls，lazyRender 下展开前不存在', async () => {
        const view = renderPanels({ keepDOM: true, motion: false });
        getHeaders().forEach((header) => {
            expect(document.getElementById(header.getAttribute('aria-controls') as string)).not.toBeNull();
        });
        await view.rerender({ lazyRender: true });
        expect(getHeaders()[1]).not.toHaveAttribute('aria-controls');
    });

    it('keepDOM 加 lazyRender：展开过再收起，内容仍在 DOM 且 aria-controls 仍指向它', async () => {
        renderPanels({ keepDOM: true, lazyRender: true, motion: false });
        await userEvent.click(getHeaders()[1]);
        await userEvent.click(getHeaders()[1]);
        expectExpanded([false, false, false]);
        const id = getHeaders()[1].getAttribute('aria-controls');
        expect(id).not.toBeNull();
        expect(document.getElementById(id as string)).not.toBeNull();
        expect(getHeaders()[2]).not.toHaveAttribute('aria-controls');
    });

    it('keepDOM 加 lazyRender：内容消失后在收起状态下恢复，未重新展开前无 aria-controls', async () => {
        const view = render(ToggledContent, { props: { show: true } });
        await userEvent.click(getHeaders()[0]);
        await view.rerender({ show: false });
        await userEvent.click(getHeaders()[0]);
        await view.rerender({ show: true });
        expectExpanded([false]);
        expect(screen.queryByText('body')).toBeNull();
        expect(getHeaders()[0]).not.toHaveAttribute('aria-controls');
        await userEvent.click(getHeaders()[0]);
        expect(document.getElementById(getHeaders()[0].getAttribute('aria-controls') as string)).not.toBeNull();
    });

    it('只设 Collapsible 的全局 keepDOM 时，收起面板的内容在 DOM 中且有 aria-controls', () => {
        semiGlobal.config.overrideDefaultProps = { Collapsible: { keepDOM: true } };
        renderPanels({ motion: false });
        getHeaders().forEach((header) => {
            expect(document.getElementById(header.getAttribute('aria-controls') as string)).not.toBeNull();
        });
    });

    it('data-* 属性传到根元素与面板元素', () => {
        const { container } = renderPanels({ 'data-foo': 'bar', 'data-testid': 'root' }, { panelAttrs: { style: { color: 'red' }, 'data-testid': 'panel' } });
        expect(screen.getByTestId('root')).toBe(container.querySelector(`.${prefixCls}`));
        expect(screen.getByTestId('root')).toHaveAttribute('data-foo', 'bar');
        expect(screen.getByTestId('panel')).toHaveClass(`${prefixCls}-item`);
        expect(screen.getByTestId('panel')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('Panel 在 Collapse 之外渲染时抛出说明性错误', () => {
        const error = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            expect(() => render(() => <CollapsePanel itemKey="1">{{ header: () => 'x' }}</CollapsePanel>)).toThrow('Collapse.Panel must be used inside Collapse');
        } finally {
            error.mockRestore();
        }
    });

    it('Collapse.Panel 与 CollapsePanel 是同一个组件', () => {
        expect(Collapse.Panel).toBe(CollapsePanel);
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', async () => {
        semiGlobal.config.overrideDefaultProps = {
            Collapse: { expandIconPosition: 'left', defaultActiveKey: '2', clickHeaderToExpand: false },
        };
        const first = renderPanels();
        expectExpanded([false, true, false]);
        expect(getRows(first.container)[0]).toHaveClass(`${prefixCls}-header-iconLeft`);
        await userEvent.click(getRows(first.container)[0]);
        expectExpanded([false, true, false]);
        first.unmount();
        const explicit = renderPanels({ defaultActiveKey: '3', expandIconPosition: 'right' });
        expectExpanded([false, false, true]);
        expect(getRows(explicit.container)[0]).not.toHaveClass(`${prefixCls}-header-iconLeft`);
    });

    it('应用注入的 semiGlobal 默认值与全局单例隔离', async () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Collapse: { defaultActiveKey: '2', accordion: true } };
        render(Panels, { global: { provide: { [semiGlobalKey as symbol]: semi } } });
        expectExpanded([false, true, false]);
        await userEvent.click(getHeaders()[0]);
        await nextTick();
        expectExpanded([true, false, false]);
    });
});
