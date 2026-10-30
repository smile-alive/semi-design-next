/** @jsxImportSource vue */
import type { VNode } from 'vue';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { stepsClasses } from '@fibrae/semi-foundation/steps/constants';
import { render } from '@test/utils/vue';
import { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import Steps, { Step, type StepSlots, type StepStatus, type StepsProps } from '../index';
import Composed from './fixtures/composed.vue';
import Instance from './fixtures/instance.vue';
import Model from './fixtures/model.vue';
import WrappedStep from './fixtures/wrapped-step.vue';

type Attrs = Record<string, unknown>;
interface StepSpec {
    attrs?: Attrs;
    slots?: { [K in keyof StepSlots]: (() => VNode[] | string) | undefined };
}

const getItems = (container: Element) => container.querySelectorAll<HTMLElement>(`.${stepsClasses.ITEM}`);
const statuses: StepStatus[] = ['wait', 'error', 'finish', 'process', 'warning'];
const types = ['fill', 'basic', 'nav'] as const;
const PREFIX = stepsClasses.PREFIX;
const ITEM = stepsClasses.ITEM;
const text = (value: string) => () => [<span>{value}</span>];

const stepNodes = (specs: StepSpec[] = []): VNode[] =>
    ['A', 'B', 'C'].map((title, index) => (
        <Step {...(specs[index]?.attrs ?? {})}>
            {{
                title: () => title,
                description: () => title.toLowerCase(),
                ...specs[index]?.slots,
            }}
        </Step>
    ));
const renderSteps = (props: StepsProps = {}, specs: StepSpec[] = [], attrs: Attrs = {}) => render(Steps, { props, attrs, slots: { default: () => stepNodes(specs) } });
const bare = (count: number, own: Attrs[] = []) => Array.from({ length: count }, (_, index) => <Step {...(own[index] ?? {})} />);

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

    it('basic 渲染 #icon 插槽，未提供 #title 时使用空的 title 类名', () => {
        const { container } = renderSteps({ type: 'basic' }, [{ slots: { icon: () => [<i class="my-icon" />], title: undefined } }]);
        const first = getItems(container)[0];
        expect(first.querySelector(`.${ITEM}-custom-icon .my-icon`)).not.toBeNull();
        expect(first.querySelector(`.${ITEM}-title-text-empty`)).not.toBeNull();
        expect(getItems(container)[1].querySelector(`.${ITEM}-title-text-empty`)).toBeNull();
    });

    it('basic 与 fill 都显示文本 #icon，#icon 存在但为空时不显示图标', () => {
        for (const type of ['basic', 'fill'] as const) {
            const view = renderSteps({ type }, [{ slots: { icon: () => 'A' } }, { slots: { icon: () => [] } }]);
            const items = getItems(view.container);
            expect(items[0].querySelector(`.${ITEM}-icon`)).toHaveTextContent('A');
            expect(items[1].querySelector(`.${ITEM}-icon`)).toBeNull();
            expect(items[1].querySelector(`.${ITEM}-number-icon`)).toBeNull();
            view.unmount();
        }
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

    it('fill 的节点标题不输出 title 属性', () => {
        const { container } = renderSteps({ type: 'fill' }, [{ slots: { title: text('A') } }]);
        expect(getItems(container)[0].querySelector(`.${ITEM}-title`)).not.toHaveAttribute('title');
        expect(getItems(container)[0].querySelector(`.${ITEM}-title`)).toHaveTextContent('A');
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

    it.each(['fill', 'basic'] as const)('%s 仅在有 onChange 或 click 监听时标记步骤可点击', (type) => {
        const plain = renderSteps({ type });
        expect(getItems(plain.container)[0]).not.toHaveClass(`${ITEM}-clickable`);
        plain.unmount();
        const withChange = renderSteps({ type, onChange: () => {} });
        expect(getItems(withChange.container)[0]).toHaveClass(`${ITEM}-clickable`);
        withChange.unmount();
        const withClick = renderSteps({ type }, [{ attrs: { onClick: () => {} } }]);
        expect(getItems(withClick.container)[0]).toHaveClass(`${ITEM}-clickable`);
        expect(getItems(withClick.container)[1]).not.toHaveClass(`${ITEM}-clickable`);
    });

    it.each(types)('%s 对每个按键调用 keydown 监听，仅 Enter 和 Space 切换步骤', async (type) => {
        const onChange = vi.fn<(current: number) => void>();
        const onKeydown = vi.fn<(event: KeyboardEvent) => void>();
        const { container } = renderSteps({ type, current: 0, onChange }, [{}, { attrs: { onKeydown } }]);
        const items = getItems(container);
        expect(items[1]).toHaveAttribute('tabindex', '0');
        items[1].focus();
        await userEvent.keyboard('a');
        expect(onKeydown).toHaveBeenCalledTimes(1);
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.keyboard('{Enter}');
        expect(onKeydown).toHaveBeenCalledTimes(2);
        expect(onChange).toHaveBeenCalledTimes(1);
        await userEvent.keyboard(' ');
        expect(onKeydown).toHaveBeenCalledTimes(3);
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange).toHaveBeenLastCalledWith(1);
    });

    it.each(types)('%s 可点击步骤是一个 button，Enter 和 Space 调用其 click 监听', async (type) => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const { container } = renderSteps({ type }, [{ attrs: { onClick } }]);
        const [first, second] = getItems(container);
        expect(first).toHaveAttribute('role', 'button');
        expect(second).not.toHaveAttribute('role');
        first.focus();
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        expect(onClick).toHaveBeenCalledTimes(2);
        expect(onClick.mock.calls[0][0].type).toBe('click');
    });

    it.each(types)('%s：点击标题里的可聚焦控件只触发它自己和步骤的 click 监听，不切换步骤', async (type) => {
        const onChange = vi.fn<(current: number) => void>();
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const { container } = renderSteps({ type, current: 1, onChange }, [{ attrs: { onClick }, slots: { title: () => [<input aria-label="name" />] } }]);
        await userEvent.click(screen.getByRole('textbox'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.click(getItems(container)[0]);
        expect(onChange).toHaveBeenCalledWith(0);
    });

    it.each(types)('%s 只有 @click.once（onClickOnce）的步骤也是可聚焦的 button', (type) => {
        const { container } = renderSteps({ type }, [{ attrs: { onClickOnce: () => {} } }]);
        const [first, second] = getItems(container);
        expect(first).toHaveAttribute('role', 'button');
        expect(first).toHaveAttribute('tabindex', '0');
        expect(second).not.toHaveAttribute('role');
    });

    it.each(types)('%s 忽略在步骤内可聚焦子元素中按下的按键', async (type) => {
        const onChange = vi.fn<(current: number) => void>();
        const { container } = renderSteps({ type, current: 0, onChange }, [{}, { slots: { title: () => [<input aria-label="inner" />] } }]);
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
        const withClick = renderSteps({ type, current: 1 }, [{ attrs: { onClick: () => {} } }]);
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
        const { container } = renderSteps({ type, size: 'small', hasLine: false, direction: 'vertical', status: 'error' }, [], { 'data-testid': 'steps', 'aria-label': 'progress' });
        const root = container.firstChild;
        expect(root).toHaveAttribute('data-testid', 'steps');
        expect(root).toHaveAttribute('aria-label', 'progress');
        for (const attr of ['size', 'hasline', 'hasLine', 'direction', 'status', 'type']) {
            expect(root).not.toHaveAttribute(attr);
        }
    });

    it.each(types)('%s Step 把 role 和 aria-label 传给步骤项', (type) => {
        const { container } = renderSteps({ type }, [{ attrs: { role: 'button', 'aria-label': 'first' } }]);
        const first = getItems(container)[0];
        expect(first).toHaveAttribute('role', 'button');
        expect(first).toHaveAttribute('aria-label', 'first');
    });
});

describe('Steps', () => {
    it('current 正常工作', () => {
        const { container } = render(Steps, { props: { current: 0 }, slots: { default: () => bare(3) } });
        const items = getItems(container);
        expect(items[0]).toHaveClass(`${ITEM}-process`);
        expect(items[1]).toHaveClass(`${ITEM}-wait`);
        expect(items[2]).toHaveClass(`${ITEM}-wait`);
    });

    it('parent status 正常工作', () => {
        for (const status of statuses) {
            const view = render(Steps, {
                props: { current: 0, status },
                slots: { default: () => bare(3) },
            });
            expect(getItems(view.container)[0]).toHaveClass(`${ITEM}-${status}`);
            view.unmount();
        }
    });

    it('child status 正常工作', () => {
        for (const status of statuses) {
            const view = render(Steps, {
                props: { current: 0 },
                slots: { default: () => bare(3, [{ status }]) },
            });
            expect(getItems(view.container)[0]).toHaveClass(`${ITEM}-${status}`);
            view.unmount();
        }
    });

    it('initial 正常工作', () => {
        const { container } = render(Steps, {
            props: { current: 1, initial: 1, status: 'warning' },
            slots: { default: () => bare(3) },
        });
        const items = getItems(container);
        expect(items[0]).toHaveClass(`${ITEM}-warning`);
        expect(items[1]).toHaveClass(`${ITEM}-wait`);
    });

    it.each(types)('%s Step 的 click 监听正常工作', async (type) => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const { container } = render(Steps, {
            props: { type, current: 1, initial: 1, status: 'warning' },
            slots: { default: () => bare(3, [{ onClick }]) },
        });
        await userEvent.click(getItems(container)[0]);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('Steps 的 onChange 正常工作', async () => {
        const onChange = vi.fn<(current: number) => void>();
        const { container } = render(Steps, {
            props: { current: 1, initial: 1, status: 'warning', onChange },
            slots: { default: () => bare(3) },
        });
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
        const { container } = renderSteps({}, [], { class: 'test', style: { color: 'red' } });
        const steps = container.querySelector(`.${PREFIX}.test`);
        expect(steps).not.toBeNull();
        expect(steps).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('Step 带自定义 class 和 style', () => {
        const { container } = renderSteps({}, [{ attrs: { class: 'test', style: { color: 'blue' } } }]);
        const firstStep = getItems(container)[0];
        expect(firstStep).toHaveClass('test');
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
});

describe('Steps 函数组件', () => {
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
        const { container } = renderSteps({ type, current: 1, status: 'error' }, [{ attrs: { class: 'mine' } }]);
        expect(getItems(container)[0]).toHaveClass('mine', `${PREFIX}-next-error`);
    });

    it('nav active 使用偏移后的步骤', () => {
        const { container } = renderSteps({ type: 'nav', initial: 1, current: 1 });
        expect(getItems(container)[0]).toHaveClass(`${ITEM}-active`);
        expect(getItems(container)[1]).not.toHaveClass(`${ITEM}-active`);
    });

    it('Steps 读取注入的 semiGlobal overrideDefaultProps，Step 不读取', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = {
            Steps: { type: 'basic', size: 'small', current: 1 },
            Step: { status: 'error' },
        } as SemiGlobal['config']['overrideDefaultProps'];
        const { container } = render(Steps, {
            global: { provide: { [semiGlobalKey]: semi } },
            slots: { default: () => stepNodes() },
        });
        expect(container.firstChild).toHaveClass(`${PREFIX}-basic`, `${PREFIX}-small`);
        expect(getItems(container)[0]).toHaveClass(`${ITEM}-finish`);
        expect(getItems(container)[1]).toHaveClass(`${ITEM}-process`);
    });

    it('全局默认的 onChange 同样使步骤可点击', async () => {
        const onChange = vi.fn<(current: number) => void>();
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Steps: { onChange } };
        const { container } = render(Steps, {
            global: { provide: { [semiGlobalKey]: semi } },
            slots: { default: () => stepNodes() },
        });
        expect(getItems(container)[2]).toHaveAttribute('role', 'button');
        await userEvent.click(getItems(container)[2]);
        expect(onChange).toHaveBeenCalledWith(2);
    });

    it.each(types)('%s 把未知属性传给根元素和 Step 项', (type) => {
        const { container } = renderSteps({ type }, [{ attrs: { id: 'first', 'data-step': 'a' } }], { id: 'steps' });
        expect(container.firstChild).toHaveAttribute('id', 'steps');
        const first = getItems(container)[0];
        expect(first).toHaveAttribute('id', 'first');
        expect(first).toHaveAttribute('data-step', 'a');
        expect(first).not.toHaveAttribute('direction');
    });

    it.each(types)('%s 的组件 $el 指向根 div 和 Step 项', (type) => {
        const view = render(Instance, { props: { type } });
        const [steps, step] = view.emitted<[Element, Element]>().els[0];
        expect(steps).toBe(view.container.firstChild);
        expect(step).toBe(getItems(view.container)[0]);
    });
});

describe('Steps（Vue）', () => {
    it('没有 onChange 与 onUpdate:current 时步骤不可聚焦；有 @change 后全部是 button', () => {
        const plain = renderSteps({ type: 'basic' });
        expect(screen.queryAllByRole('button')).toHaveLength(0);
        plain.unmount();
        renderSteps({ type: 'basic', onChange: () => {} });
        expect(screen.getAllByRole('button')).toHaveLength(3);
        for (const button of screen.getAllByRole('button')) expect(button).toHaveAttribute('tabindex', '0');
    });

    it.each(types)('%s 的 v-model:current 使步骤可点击，点击回传 initial + index', async (type) => {
        const view = render(Model, { props: { type, initial: 1 } });
        const items = getItems(view.container);
        expect(items[0]).toHaveAttribute('role', 'button');
        await userEvent.click(items[2]);
        expect(view.container.querySelector('output')).toHaveTextContent('3');
        expect(items[2]).toHaveAttribute('aria-current', 'step');
    });

    it('onChange 与 onUpdate:current 载荷相同，点击当前步骤两者都不触发', async () => {
        const onChange = vi.fn<(current: number) => void>();
        const onUpdate = vi.fn<(current: number) => void>();
        const { container } = renderSteps({ current: 1, onChange, 'onUpdate:current': onUpdate });
        await userEvent.click(getItems(container)[1]);
        expect(onChange).not.toHaveBeenCalled();
        expect(onUpdate).not.toHaveBeenCalled();
        await userEvent.click(getItems(container)[0]);
        expect(onChange).toHaveBeenCalledWith(0);
        expect(onUpdate).toHaveBeenCalledWith(0);
    });

    it('单向绑定 :current 加 @change：点击后 current 不变，父级更新后才变', async () => {
        const onChange = vi.fn<(current: number) => void>();
        const view = renderSteps({ type: 'basic', current: 0, onChange });
        await userEvent.click(getItems(view.container)[2]);
        expect(onChange).toHaveBeenCalledWith(2);
        expect(getItems(view.container)[0]).toHaveAttribute('aria-current', 'step');
        await view.rerender({ type: 'basic', current: 2, onChange });
        expect(getItems(view.container)[2]).toHaveAttribute('aria-current', 'step');
    });

    it('#title、#description、#icon 插槽渲染节点', () => {
        const { container } = renderSteps({ type: 'basic' }, [
            {
                slots: {
                    title: text('T'),
                    description: text('D'),
                    icon: () => [<b class="own-icon">*</b>],
                },
            },
        ]);
        const first = getItems(container)[0];
        expect(first.querySelector(`.${ITEM}-title-text span`)).toHaveTextContent('T');
        expect(first.querySelector(`.${ITEM}-description span`)).toHaveTextContent('D');
        expect(first.querySelector(`.${ITEM}-custom-icon .own-icon`)).not.toBeNull();
    });

    it('<template v-if> 的 #icon 条件为假时回落到默认图标', async () => {
        const view = render(Composed, { props: { type: 'basic', customIcon: true } });
        expect(view.container.querySelector('.my-icon')).not.toBeNull();
        await view.rerender({ type: 'basic', customIcon: false });
        expect(view.container.querySelector('.my-icon')).toBeNull();
        expect(view.container.querySelector('.semi-icon-tick_circle')).not.toBeNull();
    });

    it('v-for 生成的 Step 与原生元素按顺序参与序号与 fill 列宽，v-if 为假的 Step 不占位', async () => {
        const view = render(Composed, { props: { type: 'fill', titles: ['X', 'Y'] } });
        const items = getItems(view.container);
        expect(items).toHaveLength(3);
        expect(view.container.querySelector('.not-a-step')).toHaveTextContent('text');
        expect(items[0].parentElement?.style.width).toBe('25%');
        expect(items[1].querySelector(`.${ITEM}-left`)).toHaveTextContent('3');
        await view.rerender({ type: 'fill', titles: ['X', 'Y'], showSecond: true });
        expect(getItems(view.container)).toHaveLength(4);
        expect(getItems(view.container)[0].parentElement?.style.width).toBe('20%');
    });

    it.each(types)('%s 中包装 Step 的组件按位置编号，原生元素占一个序号', (type) => {
        const warn = vi.spyOn(console, 'warn');
        const { container } = render(Steps, {
            props: { type, current: 2 },
            slots: { default: () => [<WrappedStep title="A" />, <div class="own">x</div>, <WrappedStep title="B" />] },
        });
        const items = getItems(container);
        expect(items).toHaveLength(2);
        expect(container.querySelector('.own')).toHaveTextContent('x');
        // fill marks the current step by status only
        expect(items[1]).toHaveClass(type === 'fill' ? `${ITEM}-process` : `${ITEM}-active`);
        // nav shows no step number
        expect(items[1]).toHaveTextContent(type === 'nav' ? 'B' : '3B');
        expect(items[0].parentElement?.style.width).toBe(type === 'fill' ? `${100 / 3}%` : '');
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    it('Step 脱离 Steps 渲染为空', () => {
        const { container } = render(Step, { slots: { title: () => 'A' } });
        expect(container.childElementCount).toBe(0);
        expect(container).toHaveTextContent('');
    });

    it('动态切换 type 时根 class 与步骤结构随之变化', async () => {
        const view = renderSteps({ type: 'fill', current: 1 });
        expect(view.container.querySelector('.semi-row-flex')).not.toBeNull();
        await view.rerender({ type: 'basic', current: 1 });
        expect(view.container.firstChild).toHaveClass(`${PREFIX}-basic`);
        expect(view.container.querySelector('.semi-row-flex')).toBeNull();
        expect(getItems(view.container)[0].querySelector(`.${ITEM}-container`)).not.toBeNull();
        await view.rerender({ type: 'nav', current: 1 });
        expect(view.container.firstChild).toHaveClass(`${PREFIX}-nav`);
        expect(view.container.firstChild).not.toHaveClass(`${PREFIX}-basic`);
        expect(view.container.querySelector(`.${ITEM}-description`)).toBeNull();
    });

    it('Step 的 click 监听与 onChange 各调用一次', async () => {
        const onChange = vi.fn<(current: number) => void>();
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const { container } = renderSteps({ type: 'basic', current: 1, onChange }, [{ attrs: { onClick } }]);
        await userEvent.click(getItems(container)[0]);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it.each(types)('%s 根与不可点击的 Step 被命名时为 group', (type) => {
        const { container } = renderSteps({ type }, [{ attrs: { 'aria-label': 'first' } }, { attrs: { 'aria-labelledby': 'x' } }], { 'aria-label': 'progress' });
        expect(container.firstChild).toHaveAttribute('role', 'group');
        const items = getItems(container);
        expect(items[0]).toHaveAttribute('role', 'group');
        expect(items[1]).toHaveAttribute('role', 'group');
        expect(items[2]).not.toHaveAttribute('role');
    });

    it('未命名的根没有 role；可点击的 Step 被命名时仍是 button', () => {
        const { container } = renderSteps({ onChange: () => {} }, [{ attrs: { 'aria-label': 'first' } }]);
        expect(container.firstChild).not.toHaveAttribute('role');
        expect(getItems(container)[0]).toHaveAttribute('role', 'button');
    });

    it('Steps.Step 与具名导出 Step 是同一个对象', () => {
        expect(Steps.Step).toBe(Step);
    });

    it('onChange 与 onUpdate:current 在 props 中声明了 default 键', () => {
        const options = (Steps as unknown as { props: Record<string, { default?: unknown }> }).props;
        expect(Object.hasOwn(options.onChange, 'default')).toBe(true);
        expect(Object.hasOwn(options['onUpdate:current'], 'default')).toBe(true);
    });
});
