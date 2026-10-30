import { flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { stepsClasses } from '@fibrae/semi-foundation/steps/constants';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import { Steps, type StepData, type StepStatus } from '../index';
import StepsDemo from './steps-demo.svelte';

const ITEM = stepsClasses.ITEM;
const PREFIX = stepsClasses.PREFIX;
const statuses: StepStatus[] = ['wait', 'error', 'finish', 'process', 'warning'];
const types = ['fill', 'basic', 'nav'] as const;

const getItems = (container: Element) => container.querySelectorAll<HTMLElement>(`.${ITEM}`);
const bare = (count: number, own: Array<Partial<StepData>> = []): StepData[] => Array.from({ length: count }, (_, index) => own[index] ?? {});
const renderSteps = (props: Record<string, unknown> = {}) => render(StepsDemo, { props });

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = undefined;
});

describe('Steps 基线', () => {
    it.each(['fill', 'basic'] as const)('%s 根据 current 推导 wait、process、finish 状态', (type) => {
        const { container } = renderSteps({ type, current: 1 });
        const items = getItems(container);
        expect(items).toHaveLength(3);
        expect(items[0]).toHaveClass(`${ITEM}-finish`);
        expect(items[1]).toHaveClass(`${ITEM}-process`);
        expect(items[2]).toHaveClass(`${ITEM}-wait`);
    });

    it.each(['fill', 'basic'] as const)('%s 的 error 状态将前一步标记为 next-error', (type) => {
        const { container } = renderSteps({ type, current: 1, status: 'error' });
        const items = getItems(container);
        expect(items[1]).toHaveClass(`${ITEM}-error`);
        expect(items[0]).toHaveClass(`${PREFIX}-next-error`);
        expect(items[2]).not.toHaveClass(`${PREFIX}-next-error`);
    });

    it('basic 标记 active 和 done 步骤，并渲染序号或状态图标', () => {
        const { container } = renderSteps({ type: 'basic', current: 1 });
        const items = getItems(container);
        expect(items[0]).toHaveClass(`${ITEM}-done`);
        expect(items[0]).not.toHaveClass(`${ITEM}-active`);
        expect(items[1]).toHaveClass(`${ITEM}-active`);
        expect(items[0].querySelector('.semi-icon-tick_circle')).not.toBeNull();
        expect(items[1].querySelector(`.${ITEM}-icon-process`)).toHaveTextContent('2');
        expect(items[2].querySelector(`.${ITEM}-number-icon`)).toHaveTextContent('3');
        expect(items[0].querySelector(`.${ITEM}-title-text`)).toHaveTextContent('A');
        expect(items[0].querySelector(`.${ITEM}-description`)).toHaveTextContent('a');
    });

    it('basic 没有标题时使用空的 title 类名，没有描述时不渲染描述', () => {
        const { container } = renderSteps({ type: 'basic', dataSource: [{}, { title: 'B', description: 'b' }] });
        const [first, second] = getItems(container);
        expect(first.querySelector(`.${ITEM}-title-text-empty`)).not.toBeNull();
        expect(first.querySelector(`.${ITEM}-description`)).toBeNull();
        expect(second.querySelector(`.${ITEM}-title-text-empty`)).toBeNull();
        expect(second.querySelector(`.${ITEM}-description`)).toHaveTextContent('b');
    });

    it.each(['basic', 'fill'] as const)('%s 逐项设置 icon：snippet 自定义、false 无图标、未设用内置图标', (type) => {
        const { container } = renderSteps({ type, current: 2, snippets: ['icon'] });
        const [first, second, third] = getItems(container);
        const custom = type === 'basic' ? `.${ITEM}-custom-icon` : `.${ITEM}-icon`;
        expect(first.querySelector('.own-icon')).not.toBeNull();
        expect(first.querySelector('.semi-icon-tick_circle')).toBeNull();
        expect(first.querySelector(custom)).not.toBeNull();
        expect(first.querySelector(`.${ITEM}-icon-process`)).toBeNull();
        expect(second.querySelector(custom)).not.toBeNull();
        expect(second.querySelector('.own-icon, .semi-icon, svg')).toBeNull();
        expect(second.querySelector(`.${ITEM}-number-icon`)).toBeNull();
        expect(third.querySelector(custom)).toBeNull();
        expect(third.querySelector(`.${ITEM}-icon-process`)).toHaveTextContent('3');
    });

    it('title、description snippet 收到 { item, index }', () => {
        const { container } = renderSteps({ type: 'basic', snippets: ['title', 'description'] });
        const items = getItems(container);
        expect(items[1].querySelector(`.${ITEM}-title-text .own-title`)).toHaveTextContent('1:B');
        expect(items[1].querySelector(`.${ITEM}-description .own-description`)).toHaveTextContent('b!');
    });

    it('fill 渲染步骤序号、纯文本标题的 title 属性，并使用等宽列', () => {
        const { container } = renderSteps({ type: 'fill', current: 1 });
        const items = getItems(container);
        expect(items[1].querySelector(`.${ITEM}-left`)).toHaveTextContent('2');
        expect(items[1].querySelector(`.${ITEM}-icon-process`)).not.toBeNull();
        expect(items[0].querySelector(`.${ITEM}-title`)).toHaveAttribute('title', 'A');
        expect(items[0].querySelector(`.${ITEM}-description`)).toHaveAttribute('title', 'a');
        expect(items[0].parentElement?.style.width).toBe(`${100 / 3}%`);
    });

    it('fill 的 snippet 标题不输出 title 属性', () => {
        const { container } = renderSteps({ type: 'fill', snippets: ['title'] });
        expect(getItems(container)[0].querySelector(`.${ITEM}-title`)).not.toHaveAttribute('title');
        expect(getItems(container)[0].querySelector(`.${ITEM}-title`)).toHaveTextContent('0:A');
    });

    it('fill 垂直列没有宽度', () => {
        const { container } = renderSteps({ type: 'fill', direction: 'vertical' });
        expect(container.firstChild).toHaveClass(`${PREFIX}-vertical`);
        expect(getItems(container)[0].parentElement?.style.width).toBe('');
    });

    it('nav 标记当前步骤为 active，并省略最后一步后的箭头', () => {
        const { container } = renderSteps({ type: 'nav', current: 1 });
        const items = getItems(container);
        expect(items[1]).toHaveClass(`${ITEM}-active`);
        expect(items[0]).not.toHaveClass(`${ITEM}-active`);
        expect(items[0].querySelector(`.${ITEM}-icon`)).not.toBeNull();
        expect(items[2].querySelector(`.${ITEM}-icon`)).toBeNull();
        expect(items[0].querySelector(`.${ITEM}-title`)).toHaveTextContent('A');
        expect(items[0].querySelector(`.${ITEM}-description`)).toBeNull();
    });

    it('initial 使步骤序号和状态偏移', () => {
        const { container } = renderSteps({ type: 'basic', initial: 2, current: 3 });
        const items = getItems(container);
        expect(items[0]).toHaveClass(`${ITEM}-finish`);
        expect(items[1]).toHaveClass(`${ITEM}-process`);
        expect(items[1]).toHaveTextContent('4');
        expect(items[2].querySelector(`.${ITEM}-number-icon`)).toHaveTextContent('5');
    });

    it.each(types)('%s 的 onChange 接收被点击的步骤，并跳过当前步骤', async (type) => {
        const onChange = vi.fn<(current: number) => void>();
        const { container } = renderSteps({ type, current: 1, onChange });
        const items = getItems(container);
        await userEvent.click(items[1]);
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.click(items[2]);
        expect(onChange).toHaveBeenLastCalledWith(2);
        await userEvent.click(items[0]);
        expect(onChange).toHaveBeenLastCalledWith(0);
        expect(onChange).toHaveBeenCalledTimes(2);
    });

    it.each(['fill', 'basic'] as const)('%s 仅在有 onChange 或步骤自己的 onClick 时标记步骤可点击', (type) => {
        const plain = renderSteps({ type });
        expect(getItems(plain.container)[0]).not.toHaveClass(`${ITEM}-clickable`);
        plain.unmount();
        const withChange = renderSteps({ type, onChange: () => {} });
        expect(getItems(withChange.container)[0]).toHaveClass(`${ITEM}-clickable`);
        withChange.unmount();
        const withClick = renderSteps({ type, dataSource: bare(3, [{ onClick: () => {} }]) });
        expect(getItems(withClick.container)[0]).toHaveClass(`${ITEM}-clickable`);
        expect(getItems(withClick.container)[1]).not.toHaveClass(`${ITEM}-clickable`);
    });

    it.each(types)('%s 对每个按键调用 onkeydown，仅 Enter 和 Space 切换步骤', async (type) => {
        const onChange = vi.fn<(current: number) => void>();
        const onkeydown = vi.fn<(event: KeyboardEvent) => void>();
        const { container } = renderSteps({ type, current: 0, onChange, dataSource: bare(3, [{}, { onkeydown }]) });
        const items = getItems(container);
        expect(items[1]).toHaveAttribute('tabindex', '0');
        items[1].focus();
        await userEvent.keyboard('a');
        expect(onkeydown).toHaveBeenCalledTimes(1);
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.keyboard('{Enter}');
        expect(onkeydown).toHaveBeenCalledTimes(2);
        expect(onChange).toHaveBeenCalledTimes(1);
        await userEvent.keyboard(' ');
        expect(onkeydown).toHaveBeenCalledTimes(3);
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange).toHaveBeenLastCalledWith(1);
    });

    it.each(types)('%s 可点击步骤是一个 button，Enter 和 Space 调用其 onClick', async (type) => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const { container } = renderSteps({ type, dataSource: bare(3, [{ onClick }]) });
        const [first, second] = getItems(container);
        expect(first).toHaveAttribute('role', 'button');
        expect(second).not.toHaveAttribute('role');
        first.focus();
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        expect(onClick).toHaveBeenCalledTimes(2);
        expect(onClick.mock.calls[0][0].type).toBe('click');
    });

    it.each(types)('%s：点击标题里的可聚焦控件只触发步骤的 onClick，不切换步骤', async (type) => {
        const onChange = vi.fn<(current: number) => void>();
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const { container } = renderSteps({ type, current: 1, onChange, snippets: ['input-title'], dataSource: bare(3, [{ onClick }]) });
        await userEvent.click(screen.getAllByRole('textbox')[0]);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.click(getItems(container)[0]);
        expect(onChange).toHaveBeenCalledWith(0);
    });

    it.each(types)('%s 忽略在步骤内可聚焦子元素中按下的按键', async (type) => {
        const onChange = vi.fn<(current: number) => void>();
        const { container } = renderSteps({ type, current: 0, onChange, snippets: ['input-title'] });
        const input = container.querySelector('input') as HTMLInputElement;
        input.focus();
        await userEvent.keyboard(' x');
        expect(input).toHaveValue(' x');
        expect(onChange).not.toHaveBeenCalled();
    });

    it.each(types)('%s 仅用 aria-current 标记当前步骤', (type) => {
        const { container } = renderSteps({ type, current: 1 });
        const items = getItems(container);
        expect(items[0]).not.toHaveAttribute('aria-current');
        expect(items[1]).toHaveAttribute('aria-current', 'step');
        expect(items[2]).not.toHaveAttribute('aria-current');
    });

    it.each(types)('%s 仅在步骤可交互时可聚焦', (type) => {
        const plain = renderSteps({ type, current: 1 });
        for (const item of getItems(plain.container)) {
            expect(item).not.toHaveAttribute('tabindex');
            expect(item).not.toHaveAttribute('role');
        }
        plain.unmount();
        const withChange = renderSteps({ type, current: 1, onChange: () => {} });
        for (const item of getItems(withChange.container)) {
            expect(item).toHaveAttribute('tabindex', '0');
            expect(item).toHaveAttribute('role', 'button');
        }
        withChange.unmount();
        const withClick = renderSteps({ type, current: 1, dataSource: bare(3, [{ onClick: () => {} }]) });
        const items = getItems(withClick.container);
        expect(items[0]).toHaveAttribute('tabindex', '0');
        expect(items[1]).not.toHaveAttribute('tabindex');
        expect(items[2]).not.toHaveAttribute('tabindex');
    });

    it('size 为 small 时作用于 basic 和 nav；默认不添加 size 类名', () => {
        for (const type of ['basic', 'nav'] as const) {
            const small = renderSteps({ type, size: 'small' });
            expect(small.container.firstChild).toHaveClass(`${PREFIX}-small`);
            small.unmount();
            const def = renderSteps({ type });
            expect(def.container.firstChild).not.toHaveClass(`${PREFIX}-default`);
            def.unmount();
        }
    });

    it('basic 的 hasLine 默认为 true，direction 默认为 horizontal', () => {
        const { container } = renderSteps({ type: 'basic' });
        expect(container.firstChild).toHaveClass(`${PREFIX}-hasline`, `${PREFIX}-horizontal`);
    });

    it.each(types)('%s 把 data-* 和 aria-label 传给根元素，不传 props', (type) => {
        const { container } = renderSteps({ type, size: 'small', hasLine: false, direction: 'vertical', status: 'error', 'data-testid': 'steps', 'aria-label': 'progress' });
        const root = container.firstChild;
        expect(root).toHaveAttribute('data-testid', 'steps');
        expect(root).toHaveAttribute('aria-label', 'progress');
        expect(root).toHaveAttribute('role', 'group');
        for (const attr of ['size', 'hasline', 'hasLine', 'direction', 'status', 'type']) {
            expect(root).not.toHaveAttribute(attr);
        }
    });

    it.each(types)('%s 步骤数据把 role 和 aria-label 传给步骤项', (type) => {
        const { container } = renderSteps({ type, dataSource: bare(3, [{ role: 'listitem', 'aria-label': 'first' }]) });
        const first = getItems(container)[0];
        expect(first).toHaveAttribute('role', 'listitem');
        expect(first).toHaveAttribute('aria-label', 'first');
    });

    it.each(types)('%s 带 aria-label 的步骤是 group，role 为 button 的可点击步骤优先', (type) => {
        const { container } = renderSteps({ type, dataSource: bare(3, [{ 'aria-label': 'first' }]) });
        expect(getItems(container)[0]).toHaveAttribute('role', 'group');
        expect(getItems(container)[1]).not.toHaveAttribute('role');
    });
});

describe('Steps', () => {
    it('current 正常工作', () => {
        const { container } = renderSteps({ current: 0, dataSource: bare(3) });
        const items = getItems(container);
        expect(items[0]).toHaveClass(`${ITEM}-process`);
        expect(items[1]).toHaveClass(`${ITEM}-wait`);
        expect(items[2]).toHaveClass(`${ITEM}-wait`);
    });

    it('parent status 正常工作', () => {
        for (const status of statuses) {
            const view = renderSteps({ current: 0, status, dataSource: bare(3) });
            expect(getItems(view.container)[0]).toHaveClass(`${ITEM}-${status}`);
            view.unmount();
        }
    });

    it('child status 正常工作', () => {
        for (const status of statuses) {
            const view = renderSteps({ current: 0, dataSource: bare(3, [{ status }]) });
            expect(getItems(view.container)[0]).toHaveClass(`${ITEM}-${status}`);
            view.unmount();
        }
    });

    it('initial 正常工作', () => {
        const { container } = renderSteps({ current: 1, initial: 1, status: 'warning', dataSource: bare(3) });
        const items = getItems(container);
        expect(items[0]).toHaveClass(`${ITEM}-warning`);
        expect(items[1]).toHaveClass(`${ITEM}-wait`);
    });

    it.each(types)('%s 步骤的 onClick 正常工作', async (type) => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const { container } = renderSteps({ type, current: 1, initial: 1, status: 'warning', dataSource: bare(3, [{ onClick }]) });
        await userEvent.click(getItems(container)[0]);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('Steps 的 onChange 正常工作', async () => {
        const onChange = vi.fn<(current: number) => void>();
        const { container } = renderSteps({ current: 1, initial: 1, status: 'warning', onChange, dataSource: bare(3) });
        expect(getItems(container)[0]).toHaveClass(`${BASE_CLASS_PREFIX}-steps-item-warning`);
        await userEvent.click(getItems(container)[0]);
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.click(getItems(container)[1]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(2);
    });

    it('Steps 类型', () => {
        const nav = renderSteps({ type: 'nav', current: 1 });
        expect(nav.container.firstChild).toHaveClass(`${PREFIX}-nav`);
        nav.unmount();
        const basic = renderSteps({ type: 'basic', current: 1 });
        expect(basic.container.firstChild).toHaveClass(`${PREFIX}-basic`);
        basic.unmount();
        const fill = renderSteps({ type: 'fill', current: 1 });
        expect(fill.container.firstChild).toHaveClass(PREFIX);
        expect(fill.container.firstChild).not.toHaveClass(`${PREFIX}-basic`);
        expect(fill.container.firstChild).not.toHaveClass(`${PREFIX}-nav`);
    });

    it('Steps 带自定义 class 和 style', () => {
        const { container } = renderSteps({ class: 'test', style: 'color: red' });
        const steps = container.querySelector(`.${PREFIX}.test`);
        expect(steps).not.toBeNull();
        expect(steps).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('步骤数据的 class 和 style 落在步骤项上', () => {
        const { container } = renderSteps({ dataSource: bare(3, [{ class: 'test', style: 'color: blue' }]) });
        const firstStep = getItems(container)[0];
        expect(firstStep).toHaveClass('test', ITEM);
        expect(firstStep).toHaveStyle({ color: 'rgb(0, 0, 255)' });
        expect(getItems(container)[1]).not.toHaveClass('test');
    });

    it('Steps 带 size、hasLine 与 direction', () => {
        const small = renderSteps({ type: 'basic', size: 'small' });
        expect(small.container.firstChild).toHaveClass(`${PREFIX}-small`);
        small.unmount();
        const noLine = renderSteps({ type: 'basic', current: 1, hasLine: false });
        expect(noLine.container.firstChild).not.toHaveClass(`${PREFIX}-hasline`);
        noLine.unmount();
        const vertical = renderSteps({ type: 'basic', current: 1, direction: 'vertical' });
        expect(vertical.container.firstChild).toHaveClass(`${PREFIX}-vertical`);
    });

    it.each(['basic', 'nav'] as const)('%s 的 onChange 将偏移后的步骤与 current 比较', async (type) => {
        const onChange = vi.fn<(current: number) => void>();
        const { container } = renderSteps({ type, initial: 1, current: 1, onChange });
        await userEvent.click(getItems(container)[0]);
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.click(getItems(container)[1]);
        expect(onChange).toHaveBeenCalledWith(2);
    });

    it.each(['fill', 'basic'] as const)('%s next-error 使用偏移后的步骤', (type) => {
        const { container } = renderSteps({ type, initial: 1, current: 2, status: 'error' });
        const items = getItems(container);
        expect(items[1]).toHaveClass(`${ITEM}-error`);
        expect(items[0]).toHaveClass(`${PREFIX}-next-error`);
        expect(items[1]).not.toHaveClass(`${PREFIX}-next-error`);
    });

    it.each(['fill', 'basic'] as const)('%s next-error 保留步骤已有的 class', (type) => {
        const { container } = renderSteps({ type, current: 1, status: 'error', dataSource: bare(3, [{ class: 'mine' }]) });
        expect(getItems(container)[0]).toHaveClass('mine', `${PREFIX}-next-error`);
    });

    it('nav active 使用偏移后的步骤', () => {
        const { container } = renderSteps({ type: 'nav', initial: 1, current: 1 });
        expect(getItems(container)[0]).toHaveClass(`${ITEM}-active`);
        expect(getItems(container)[1]).not.toHaveClass(`${ITEM}-active`);
    });

    it('dataSource 变化时增减步骤，列宽随数量更新', () => {
        const store = createStore({ dataSource: bare(2) });
        const view = renderSteps({ type: 'fill', store });
        expect(getItems(view.container)).toHaveLength(2);
        expect(getItems(view.container)[0].parentElement?.style.width).toBe('50%');
        store.dataSource = bare(4);
        flushSync();
        expect(getItems(view.container)).toHaveLength(4);
        expect(getItems(view.container)[0].parentElement?.style.width).toBe('25%');
    });

    it('没有 dataSource 时只渲染根元素', () => {
        const { container } = render(Steps, { props: { type: 'basic' } });
        expect(container.firstElementChild).toHaveClass(`${PREFIX}-basic`);
        expect(getItems(container)).toHaveLength(0);
    });

    it('读取全局默认值，显式属性优先', () => {
        semiGlobal.config.overrideDefaultProps = { Steps: { type: 'basic', size: 'small', current: 1 } };
        const { container } = renderSteps();
        expect(container.firstChild).toHaveClass(`${PREFIX}-basic`, `${PREFIX}-small`);
        expect(getItems(container)[0]).toHaveClass(`${ITEM}-finish`);
        expect(getItems(container)[1]).toHaveClass(`${ITEM}-process`);
        const explicit = renderSteps({ type: 'nav' });
        expect(explicit.container.firstChild).toHaveClass(`${PREFIX}-nav`);
    });

    it('全局默认的 onChange 同样使步骤可点击', async () => {
        const onChange = vi.fn<(current: number) => void>();
        semiGlobal.config.overrideDefaultProps = { Steps: { onChange } };
        const { container } = renderSteps();
        expect(getItems(container)[2]).toHaveAttribute('role', 'button');
        await userEvent.click(getItems(container)[2]);
        expect(onChange).toHaveBeenCalledWith(2);
    });

    it.each(types)('%s 把未知属性传给根元素和步骤项', (type) => {
        const { container } = renderSteps({ type, id: 'steps', dataSource: bare(3, [{ id: 'first', 'data-step': 'a' }]) });
        expect(container.firstChild).toHaveAttribute('id', 'steps');
        const first = getItems(container)[0];
        expect(first).toHaveAttribute('id', 'first');
        expect(first).toHaveAttribute('data-step', 'a');
        expect(first).not.toHaveAttribute('direction');
        expect(first).not.toHaveAttribute('status');
        expect(first).not.toHaveAttribute('onclick');
    });

    it('单向 current 加 onChange：点击后 current 不变，父级更新后才变', async () => {
        const onChange = vi.fn<(current: number) => void>();
        const store = createStore({ current: 0 });
        const view = renderSteps({ type: 'basic', onChange, store });
        await userEvent.click(getItems(view.container)[2]);
        expect(onChange).toHaveBeenCalledWith(2);
        expect(getItems(view.container)[0]).toHaveAttribute('aria-current', 'step');
        store.current = 2;
        flushSync();
        expect(getItems(view.container)[2]).toHaveAttribute('aria-current', 'step');
    });
});
