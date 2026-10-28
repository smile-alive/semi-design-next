import { createSignal, For, Show } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { stepsClasses } from '@fibrae/semi-foundation/steps/constants';
import Steps, { type BasicStepProps, type FillStepProps, type NavStepProps, type Status, type StepProps, type StepsProps } from '..';
import semiGlobal from '../../_utils/semi-global';

const Step = Steps.Step;

const getItems = (container: HTMLElement) => container.querySelectorAll<HTMLElement>(`.${stepsClasses.ITEM}`);
const statuses: Status[] = ['wait', 'error', 'finish', 'process', 'warning'];
const types = ['fill', 'basic', 'nav'] as const;
const PREFIX = stepsClasses.PREFIX;
const ITEM = stepsClasses.ITEM;

// the prop bag is spread on purpose: the tests pass every prop of every type, including the undeclared ones
const renderSteps = (props: Record<string, unknown> = {}, stepProps: Partial<StepProps>[] = []) =>
    render(() => (
        <Steps {...(props as StepsProps)}>
            <Step title="A" description="a" {...stepProps[0]} />
            <Step title="B" description="b" {...stepProps[1]} />
            <Step title="C" description="c" {...stepProps[2]} />
        </Steps>
    ));

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

    it('nav 不加 next-error 类名', () => {
        const { container } = renderSteps({ type: 'nav', current: 1, status: 'error' });
        for (const item of getItems(container)) {
            expect(item).not.toHaveClass(`${PREFIX}-next-error`);
        }
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

    it('basic 的 error 与 warning 状态显示对应图标', () => {
        const { container } = renderSteps({ type: 'basic' }, [{ status: 'error' }, { status: 'warning' }]);
        const items = getItems(container);
        expect(items[0].querySelector('.semi-icon-alert_circle')).not.toBeNull();
        expect(items[1].querySelector('.semi-icon-alert_triangle')).not.toBeNull();
    });

    it('basic 渲染自定义图标，并使用空的 title 类名', () => {
        const { container } = render(() => (
            <Steps type="basic">
                <Step icon={<i class="my-icon" />} />
            </Steps>
        ));
        const first = getItems(container)[0];
        expect(first.querySelector(`.${ITEM}-custom-icon .my-icon`)).not.toBeNull();
        expect(first.querySelector(`.${ITEM}-title-text-empty`)).not.toBeNull();
    });

    it('basic 与 fill 都显示字符串图标，icon 为 null 时不显示', () => {
        for (const type of ['basic', 'fill'] as const) {
            const { container, unmount } = renderSteps({ type }, [{ icon: 'A' }, { icon: null }]);
            const items = getItems(container);
            expect(items[0].querySelector(`.${ITEM}-icon`)).toHaveTextContent('A');
            expect(items[1].querySelector(`.${ITEM}-icon`)).toBeNull();
            unmount();
        }
    });

    it('fill 渲染步骤序号、字符串标题，并使用等宽列', () => {
        const { container } = renderSteps({ type: 'fill', current: 1 });
        const items = getItems(container);
        expect(items[1].querySelector(`.${ITEM}-left`)).toHaveTextContent('2');
        expect(items[1].querySelector(`.${ITEM}-icon-process`)).not.toBeNull();
        expect(items[0].querySelector(`.${ITEM}-title`)).toHaveAttribute('title', 'A');
        expect(items[0].querySelector(`.${ITEM}-description`)).toHaveAttribute('title', 'a');
        expect((items[0].parentElement as HTMLElement).style.width).toBe(`${100 / 3}%`);
    });

    it('fill 非字符串标题不写 title 属性', () => {
        const { container } = renderSteps({ type: 'fill' }, [{ title: <b>bold</b> }]);
        expect(getItems(container)[0].querySelector(`.${ITEM}-title`)).not.toHaveAttribute('title');
    });

    it('fill 垂直列没有宽度', () => {
        const { container } = renderSteps({ type: 'fill', direction: 'vertical' });
        expect(container.firstChild).toHaveClass(`${PREFIX}-vertical`);
        expect((getItems(container)[0].parentElement as HTMLElement).style.width).toBe('');
    });

    it('nav 标记当前步骤为 active，并省略最后一步后的箭头', () => {
        const { container } = renderSteps({ type: 'nav', current: 1 });
        const items = getItems(container);
        expect(items[1]).toHaveClass(`${ITEM}-active`);
        expect(items[0]).not.toHaveClass(`${ITEM}-active`);
        expect(items[0].querySelector(`.${ITEM}-icon`)).not.toBeNull();
        expect(items[2].querySelector(`.${ITEM}-icon`)).toBeNull();
        expect(items[0].querySelector(`.${ITEM}-title`)).toHaveTextContent('A');
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

    it.each(['fill', 'basic'] as const)('%s 仅在有 onChange 或 onClick 时标记步骤可点击', (type) => {
        const plain = renderSteps({ type });
        expect(getItems(plain.container)[0]).not.toHaveClass(`${ITEM}-clickable`);
        plain.unmount();
        const withChange = renderSteps({ type, onChange: () => {} });
        expect(getItems(withChange.container)[0]).toHaveClass(`${ITEM}-clickable`);
        withChange.unmount();
        const withClick = renderSteps({ type }, [{ onClick: () => {} }]);
        expect(getItems(withClick.container)[0]).toHaveClass(`${ITEM}-clickable`);
        expect(getItems(withClick.container)[1]).not.toHaveClass(`${ITEM}-clickable`);
    });

    it.each(types)('%s 对每个按键调用 onKeyDown，仅 Enter 和 Space 切换步骤', async (type) => {
        const onChange = vi.fn<(current: number) => void>();
        const onKeyDown = vi.fn<() => void>();
        const { container } = renderSteps({ type, current: 0, onChange }, [{}, { onKeyDown }]);
        const items = getItems(container);
        expect(items[1]).toHaveAttribute('tabindex', '0');
        items[1].focus();
        await userEvent.keyboard('a');
        expect(onKeyDown).toHaveBeenCalledTimes(1);
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.keyboard('{Enter}');
        expect(onKeyDown).toHaveBeenCalledTimes(2);
        expect(onChange).toHaveBeenCalledTimes(1);
        await userEvent.keyboard(' ');
        expect(onKeyDown).toHaveBeenCalledTimes(3);
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange).toHaveBeenLastCalledWith(1);
    });

    it.each(types)('%s 可点击步骤是一个 button，Enter 和 Space 调用其 onClick', async (type) => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const { container } = renderSteps({ type }, [{ onClick }]);
        const [first, second] = getItems(container);
        expect(first).toHaveAttribute('role', 'button');
        expect(second).not.toHaveAttribute('role');
        first.focus();
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        expect(onClick).toHaveBeenCalledTimes(2);
        expect(onClick.mock.calls[0][0].type).toBe('click');
    });

    it.each(types)('%s 忽略在步骤内可聚焦子元素中按下的按键', async (type) => {
        const onChange = vi.fn<(current: number) => void>();
        const { container } = renderSteps({ type, current: 0, onChange }, [{}, { title: <input aria-label="inner" /> }]);
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
        }
        plain.unmount();
        const withChange = renderSteps({ type, current: 1, onChange: () => {} });
        for (const item of getItems(withChange.container)) {
            expect(item).toHaveAttribute('tabindex', '0');
        }
        withChange.unmount();
        const withClick = renderSteps({ type, current: 1 }, [{ onClick: () => {} }]);
        const items = getItems(withClick.container);
        expect(items[0]).toHaveAttribute('tabindex', '0');
        expect(items[1]).not.toHaveAttribute('tabindex');
        expect(items[2]).not.toHaveAttribute('tabindex');
    });

    it('size 为 small 时作用于 basic 和 nav；默认不添加 size 类名', () => {
        for (const type of ['basic', 'nav']) {
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

    it.each(types)('%s 把 data-* 和 aria-label 传给根元素，不传外来属性', (type) => {
        const { container } = renderSteps({
            type,
            'data-testid': 'steps',
            'aria-label': 'progress',
            size: 'small',
            hasLine: false,
            direction: 'vertical',
            status: 'error',
        });
        const root = container.firstChild as HTMLElement;
        expect(root).toHaveAttribute('data-testid', 'steps');
        expect(root).toHaveAttribute('aria-label', 'progress');
        for (const attr of ['size', 'hasline', 'hasLine', 'direction', 'status', 'type', 'current', 'initial', 'prefixcls']) {
            expect(root).not.toHaveAttribute(attr);
        }
    });

    it.each(types)('%s Step 把 role 和 aria-label 传给步骤项', (type) => {
        const { container } = renderSteps({ type }, [{ role: 'button', 'aria-label': 'first' }]);
        const first = getItems(container)[0];
        expect(first).toHaveAttribute('role', 'button');
        expect(first).toHaveAttribute('aria-label', 'first');
    });
});

describe('Steps', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
        vi.restoreAllMocks();
    });

    it('Step 的属性类型不含 children', () => {
        expectTypeOf<StepProps>().not.toHaveProperty('children');
        expectTypeOf<BasicStepProps>().not.toHaveProperty('children');
        expectTypeOf<FillStepProps>().not.toHaveProperty('children');
        expectTypeOf<NavStepProps>().not.toHaveProperty('children');
    });

    it('current 正常工作', () => {
        const { container } = render(() => (
            <Steps current={0}>
                <Step />
                <Step />
                <Step />
            </Steps>
        ));
        const items = getItems(container);
        expect(items[0]).toHaveClass(`${ITEM}-process`);
        expect(items[1]).toHaveClass(`${ITEM}-wait`);
        expect(items[2]).toHaveClass(`${ITEM}-wait`);
    });

    it.each(types)('%s 类型按展开 Fragment 后的位置标记 current', (type) => {
        const { container } = render(() => (
            <Steps type={type} current={2}>
                <Step title="A" />
                <>
                    <Step title="B" />
                    <Step title="C" />
                </>
            </Steps>
        ));
        const items = getItems(container);
        expect(items).toHaveLength(3);
        expect(items[2]).toHaveAttribute('aria-current', 'step');
    });

    it('parent status 正常工作', () => {
        for (const status of statuses) {
            const { container, unmount } = render(() => (
                <Steps current={0} status={status}>
                    <Step />
                    <Step />
                    <Step />
                </Steps>
            ));
            expect(getItems(container)[0]).toHaveClass(`${ITEM}-${status}`);
            unmount();
        }
    });

    it('child status 正常工作', () => {
        for (const status of statuses) {
            const { container, unmount } = render(() => (
                <Steps current={0}>
                    <Step status={status} />
                    <Step />
                    <Step />
                </Steps>
            ));
            expect(getItems(container)[0]).toHaveClass(`${ITEM}-${status}`);
            unmount();
        }
    });

    it('initial 正常工作', () => {
        const { container } = render(() => (
            <Steps current={1} initial={1} status="warning">
                <Step />
                <Step />
                <Step />
            </Steps>
        ));
        const items = getItems(container);
        expect(items[0]).toHaveClass(`${ITEM}-warning`);
        expect(items[1]).toHaveClass(`${ITEM}-wait`);
    });

    it.each([undefined, 'basic', 'nav'] as const)('%s 类型的 Step onClick 正常工作', async (type) => {
        const spyOnClick = vi.fn<() => void>();
        const { container } = render(() => (
            <Steps type={type} current={1} initial={1}>
                <Step onClick={spyOnClick} />
                <Step />
                <Step />
            </Steps>
        ));
        await userEvent.click(getItems(container)[0]);
        expect(spyOnClick).toHaveBeenCalledTimes(1);
    });

    it('Steps 的 onChange 正常工作', async () => {
        const spyOnChange = vi.fn<(current: number) => void>();
        const { container } = render(() => (
            <Steps current={1} initial={1} status="warning" onChange={spyOnChange}>
                <Step />
                <Step />
                <Step />
            </Steps>
        ));
        expect(getItems(container)[0]).toHaveClass(`${BASE_CLASS_PREFIX}-steps-item-warning`);
        await userEvent.click(getItems(container)[0]);
        expect(spyOnChange).not.toHaveBeenCalled();
        await userEvent.click(getItems(container)[1]);
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenCalledWith(2);
    });

    it.each(types)('%s：点击标题里的可聚焦控件只触发它自己和步骤的 onClick，不切换步骤', async (type) => {
        const onChange = vi.fn<(current: number) => void>();
        const onClick = vi.fn<() => void>();
        const { container } = render(() => (
            <Steps type={type} current={1} onChange={onChange}>
                <Step title={<input aria-label="name" />} onClick={onClick} />
                <Step title="B" />
            </Steps>
        ));
        await userEvent.click(screen.getByRole('textbox'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.click(getItems(container)[0]);
        expect(onChange).toHaveBeenCalledWith(0);
    });

    it('nav 不把 description、icon、status 作为未知属性落到步骤项', () => {
        const { container } = render(() => (
            <Steps type="nav">
                <Step title="A" description="d" status="error" icon="i" />
            </Steps>
        ));
        const item = getItems(container)[0];
        expect(item).not.toHaveAttribute('description');
        expect(item).not.toHaveAttribute('icon');
        expect(item).not.toHaveAttribute('status');
    });

    it('Steps 类型', () => {
        const steps = (type: 'fill' | 'basic' | 'nav') => (
            <Steps type={type} current={1}>
                <Step title="Finished" />
                <Step title="In Progress" />
                <Step title="Waiting" />
            </Steps>
        );
        const nav = render(() => steps('nav'));
        expect(nav.container.firstChild).toHaveClass(`${BASE_CLASS_PREFIX}-steps-nav`);
        nav.unmount();

        const basic = render(() => steps('basic'));
        expect(basic.container.firstChild).toHaveClass(`${BASE_CLASS_PREFIX}-steps-basic`);
        basic.unmount();

        const fill = render(() => steps('fill'));
        expect(fill.container.firstChild).toHaveClass(`${BASE_CLASS_PREFIX}-steps`);
        expect(fill.container.firstChild).not.toHaveClass(`${BASE_CLASS_PREFIX}-steps-basic`);
        expect(fill.container.firstChild).not.toHaveClass(`${BASE_CLASS_PREFIX}-steps-nav`);
        fill.unmount();
    });

    it('Steps 带自定义 class 和 style', () => {
        const { container } = render(() => (
            <Steps class="test" style={{ color: 'red' }}>
                <Step title="Finished" />
                <Step title="In Progress" />
                <Step title="Waiting" />
            </Steps>
        ));
        const steps = container.querySelector(`.${BASE_CLASS_PREFIX}-steps.test`);
        expect(steps).not.toBeNull();
        expect(steps).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('Step 带自定义 class 和 style', () => {
        const { container } = render(() => (
            <Steps>
                <Step class="test" style={{ color: 'blue' }} title="Finished" />
                <Step title="In Progress" />
                <Step title="Waiting" />
            </Steps>
        ));
        const firstStep = getItems(container)[0];
        expect(firstStep).toHaveClass('test');
        expect(firstStep).toHaveStyle({ color: 'rgb(0, 0, 255)' });
        expect(getItems(container)[1]).not.toHaveClass('test');
    });

    it('Steps 带 size', () => {
        const { container } = render(() => (
            <Steps type="basic" size="small">
                <Step title="Finished" />
                <Step title="In Progress" />
            </Steps>
        ));
        expect(container.firstChild).toHaveClass(`${BASE_CLASS_PREFIX}-steps-small`);
    });

    it('Steps 带 hasLine', () => {
        const steps = (hasLine: boolean) => (
            <Steps type="basic" current={1} hasLine={hasLine}>
                <Step title="Finished" description="This is a description" />
                <Step title="In Progress" description="This is a description" />
            </Steps>
        );
        const hasLineResult = render(() => steps(true));
        expect(hasLineResult.container.firstChild).toHaveClass(`${BASE_CLASS_PREFIX}-steps-hasline`);
        hasLineResult.unmount();

        const noLineResult = render(() => steps(false));
        expect(noLineResult.container.firstChild).not.toHaveClass(`${BASE_CLASS_PREFIX}-steps-hasline`);
        noLineResult.unmount();
    });

    it('Steps 带 direction', () => {
        const steps = (direction: 'vertical' | 'horizontal') => (
            <Steps type="basic" current={1} direction={direction}>
                <Steps.Step title="Finished" description="This is a description" />
                <Steps.Step title="In Progress" description="This is a description" />
            </Steps>
        );
        const vertical = render(() => steps('vertical'));
        expect(vertical.container.firstChild).toHaveClass(`${BASE_CLASS_PREFIX}-steps-vertical`);
        vertical.unmount();

        const horizontal = render(() => steps('horizontal'));
        expect(horizontal.container.firstChild).toHaveClass(`${BASE_CLASS_PREFIX}-steps-horizontal`);
        horizontal.unmount();
    });
});

describe('Steps 响应式', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
        vi.restoreAllMocks();
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
        const { container } = renderSteps({ type, current: 1, status: 'error' }, [{ class: 'mine' }]);
        expect(getItems(container)[0]).toHaveClass('mine', `${PREFIX}-next-error`);
    });

    it('nav active 使用偏移后的步骤', () => {
        const { container } = renderSteps({ type: 'nav', initial: 1, current: 1 });
        expect(getItems(container)[0]).toHaveClass(`${ITEM}-active`);
        expect(getItems(container)[1]).not.toHaveClass(`${ITEM}-active`);
    });

    it.each(types)('%s：current、status、type 与 onChange 变化时原地更新', async (type) => {
        const [current, setCurrent] = createSignal(0);
        const [status, setStatus] = createSignal<Status>('process');
        const [onChange, setOnChange] = createSignal<((current: number) => void) | undefined>();
        const { container } = render(() => (
            <Steps type={type} current={current()} status={status()} onChange={onChange()}>
                <Step title="A" />
                <Step title="B" />
            </Steps>
        ));
        const [first, second] = getItems(container);
        expect(first).toHaveAttribute('aria-current', 'step');
        expect(first).not.toHaveAttribute('tabindex');
        setCurrent(1);
        expect(getItems(container)[0]).toBe(first);
        expect(second).toHaveAttribute('aria-current', 'step');
        expect(first).not.toHaveAttribute('aria-current');
        setStatus('error');
        // nav has neither a status class nor next-error
        expect(second.classList.contains(`${ITEM}-error`)).toBe(type !== 'nav');
        expect(first.classList.contains(`${PREFIX}-next-error`)).toBe(type !== 'nav');
        const handler = vi.fn<(current: number) => void>();
        setOnChange(() => handler);
        expect(first).toHaveAttribute('tabindex', '0');
        await userEvent.click(first);
        expect(handler).toHaveBeenCalledWith(0);
    });

    it('Step 的 title、description 与 status 变化时原地更新', () => {
        const [title, setTitle] = createSignal('A');
        const [description, setDescription] = createSignal<string | undefined>('a');
        const [status, setStatus] = createSignal<Status | undefined>();
        const { container } = render(() => (
            <Steps type="basic">
                <Step title={title()} description={description()} status={status()} />
            </Steps>
        ));
        const item = getItems(container)[0];
        setTitle('B');
        expect(item.querySelector(`.${ITEM}-title-text`)).toHaveTextContent('B');
        setDescription(undefined);
        expect(item.querySelector(`.${ITEM}-description`)).toBeNull();
        setStatus('finish');
        expect(getItems(container)[0]).toBe(item);
        expect(item).toHaveClass(`${ITEM}-finish`);
    });

    it.each(types)('%s：动态增删 Step 后位置与 total 重新计算', (type) => {
        const [keys, setKeys] = createSignal(['a', 'b']);
        const { container } = render(() => (
            <Steps type={type} current={1}>
                <For each={keys()}>{(key) => <Step title={key} />}</For>
            </Steps>
        ));
        expect(getItems(container)).toHaveLength(2);
        setKeys(['a', 'b', 'c']);
        const items = getItems(container);
        expect(items).toHaveLength(3);
        expect(items[1]).toHaveAttribute('aria-current', 'step');
        setKeys(['a']);
        expect(getItems(container)).toHaveLength(1);
    });

    it('fill 的列宽随 Step 数量更新', () => {
        const [keys, setKeys] = createSignal(['a', 'b']);
        const { container } = render(() => (
            <Steps>
                <For each={keys()}>{(key) => <Step title={key} />}</For>
            </Steps>
        ));
        setKeys(['a', 'b', 'c']);
        expect((getItems(container)[0].parentElement as HTMLElement).style.width).toBe(`${100 / 3}%`);
    });

    it('nav 的箭头随 Step 数量更新', () => {
        const [keys, setKeys] = createSignal(['a', 'b']);
        const { container } = render(() => (
            <Steps type="nav">
                <For each={keys()}>{(key) => <Step title={key} />}</For>
            </Steps>
        ));
        expect(getItems(container)[1].querySelector(`.${ITEM}-icon`)).toBeNull();
        setKeys(['a', 'b', 'c']);
        expect(getItems(container)[1].querySelector(`.${ITEM}-icon`)).not.toBeNull();
        expect(getItems(container)[2].querySelector(`.${ITEM}-icon`)).toBeNull();
    });

    it.each(types)('%s 的每个 Step 按顺序占一个序号：包装 Step 的组件照常编号，其他节点被丢弃并告警', (type) => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const MyStep = (props: StepProps) => <Step {...props} />;
        const { container } = render(() => (
            <Steps type={type} current={1}>
                <MyStep title="A" />
                <div class="own">x</div>
                text
                <MyStep title="B" />
            </Steps>
        ));
        const items = getItems(container);
        expect(items).toHaveLength(2);
        expect(container.querySelector('.own')).toBeNull();
        expect(items[1]).toHaveClass(type === 'fill' ? `${ITEM}-process` : `${ITEM}-active`);
        // nav shows no step number
        expect(items[1]).toHaveTextContent(type === 'nav' ? 'B' : '2B');
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('[Semi Steps]'));
    });

    it('只有 Step 与空值作 children 时不告警', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const [show, setShow] = createSignal(false);
        render(() => (
            <Steps>
                <Step title="A" />
                <Show when={show()}>
                    <Step title="B" />
                </Show>
                {null}
                {false}
            </Steps>
        ));
        expect(warn).not.toHaveBeenCalled();
        setShow(true);
        expect(warn).not.toHaveBeenCalled();
    });

    it('Steps 从 semiGlobal overrideDefaultProps 读取默认值，Step 不读取', () => {
        semiGlobal.config.overrideDefaultProps = {
            Steps: { type: 'basic', size: 'small' },
            Step: { status: 'error' },
        } as typeof semiGlobal.config.overrideDefaultProps;
        const { container } = renderSteps({ current: 1 });
        expect(container.firstChild).toHaveClass(`${PREFIX}-basic`, `${PREFIX}-small`);
        expect(getItems(container)[0]).toHaveClass(`${ITEM}-finish`);
    });

    it.each(types)('%s 把未知属性传给根元素和 Step 项', (type) => {
        const { container } = renderSteps({ type, id: 'steps' }, [{ id: 'first', 'data-step': 'a' } as StepProps]);
        expect(container.firstChild).toHaveAttribute('id', 'steps');
        const first = getItems(container)[0];
        expect(first).toHaveAttribute('id', 'first');
        expect(first).toHaveAttribute('data-step', 'a');
        expect(first).not.toHaveAttribute('direction');
    });

    it.each(types)('%s 的 ref 指向根 div 和 Step 项', (type) => {
        let root: HTMLDivElement | undefined;
        let item: HTMLDivElement | undefined;
        const { container } = renderSteps({ type, ref: (node: HTMLDivElement) => (root = node) }, [{ ref: (node: HTMLDivElement) => (item = node) }]);
        expect(root).toBe(container.firstChild);
        expect(item).toBe(getItems(container)[0]);
    });

    it.each(types)('%s 带 aria-label 或 aria-labelledby 时，根与不可点击的步骤是 group', (type) => {
        const [labelled, setLabelled] = createSignal(false);
        const { container } = render(() => (
            <Steps type={type} aria-label={labelled() ? undefined : '进度'} aria-labelledby={labelled() ? 'x' : undefined} onChange={labelled() ? () => {} : undefined}>
                <Step aria-label={labelled() ? undefined : '第一步'} aria-labelledby={labelled() ? 'y' : undefined} title="A" />
                <Show when={!labelled()}>
                    <Step title="B" />
                </Show>
            </Steps>
        ));
        const root = container.firstElementChild as Element;
        const [first, second] = getItems(container);
        expect(root).toHaveAttribute('role', 'group');
        expect(first).toHaveAttribute('role', 'group');
        expect(second).not.toHaveAttribute('role');
        setLabelled(true);
        expect(container.firstElementChild).toHaveAttribute('role', 'group');
        expect(getItems(container)[0]).toHaveAttribute('role', 'button');
    });

    it.each(types)('%s 没有名称时根与步骤不加 role', (type) => {
        const { container } = renderSteps({ type });
        expect(container.firstElementChild).not.toHaveAttribute('role');
        getItems(container).forEach((item) => expect(item).not.toHaveAttribute('role'));
    });

    it('Step 在 Steps 之外不渲染任何内容', () => {
        const { container } = render(() => <Step title="A" />);
        expect(container).toBeEmptyDOMElement();
    });
});
