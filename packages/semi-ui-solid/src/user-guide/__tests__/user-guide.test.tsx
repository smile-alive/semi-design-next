import { type JSX, Show, createSignal, onMount } from 'solid-js';
import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { sleep } from '@test/utils/solid';
import UserGuide, { type StepItem, type StepRenderProps, type UserGuideProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import { LocaleProvider } from '../../locale';
import Modal from '../../modal';

const prefix = `${BASE_CLASS_PREFIX}-userGuide`;
const $ = (selector: string) => document.querySelector<HTMLElement>(selector) as HTMLElement;
const $$ = (selector: string) => document.querySelectorAll(selector);

type TestTarget = HTMLDivElement & { rect: { x: number; y: number; width: number; height: number } };
type ClickHandler = (event: MouseEvent) => void;

let targets: TestTarget[] = [];

// jsdom has no layout: each target reports the rect stored on it, which a test may move
function makeTarget(x: number, y: number, width: number, height: number) {
    const el = document.createElement('div') as TestTarget;
    el.rect = { x, y, width, height };
    el.getBoundingClientRect = () => new DOMRect(el.rect.x, el.rect.y, el.rect.width, el.rect.height);
    document.body.appendChild(el);
    targets.push(el);
    return el;
}

const targetOf = (step: StepItem) => step.target as TestTarget;

function makeSteps(): StepItem[] {
    const a = makeTarget(10, 20, 100, 30);
    const b = makeTarget(200, 300, 50, 40);
    const c = makeTarget(400, 100, 80, 20);
    return [
        { target: a, title: 'Title A', description: 'Desc A' },
        { target: () => b, title: 'Title B', description: 'Desc B' },
        { target: c, title: 'Title C', description: 'Desc C' },
    ];
}

// only the first step has a cover
const firstCover = ({ index }: StepRenderProps) => (index === 0 ? <img alt="cover-a" /> : null);

// Props are spread from a signal, as a consumer does with a store: every key is notified on any change
function renderGuide(initial: UserGuideProps, wrap: (guide: () => JSX.Element) => JSX.Element = (guide) => guide()) {
    const [props, setProps] = createSignal<UserGuideProps>(initial);
    const result = render(() => wrap(() => <UserGuide {...props()} />));
    return { ...result, rerender: (next: UserGuideProps) => setProps(next) };
}

const withEnglish = (guide: () => JSX.Element) => <LocaleProvider locale={en_US}>{guide()}</LocaleProvider>;
const spotRect = () => $(`.${prefix}-spotlight-rect`);
const rectOf = (el: Element) => ['x', 'y', 'width', 'height'].map((key) => Number(el.getAttribute(key)));
const indicator = () => document.querySelector(`.${prefix}-popup-content-indicator`)?.textContent;

afterEach(() => {
    for (const el of targets) {
        el.remove();
    }
    targets = [];
    document.body.removeAttribute('style');
});

describe('UserGuide 弹出模式', () => {
    it('隐藏或无步骤时不渲染任何内容', () => {
        const { unmount } = renderGuide({ steps: makeSteps() });
        expect($(`.${prefix}-popover`)).toBeNull();
        expect($(`.${prefix}-spotlight`)).toBeNull();
        unmount();
        renderGuide({ steps: [], visible: true });
        expect($(`.${prefix}-popover`)).toBeNull();
        expect($(`.${prefix}-spotlight`)).toBeNull();
    });

    it('在 popover 中渲染当前步骤，并应用 class 与 style', async () => {
        renderGuide({ class: 'custom', style: { color: 'red' }, steps: makeSteps(), visible: true, renderCover: firstCover });
        await screen.findByText('Title A');
        expect(screen.getByText('Desc A')).toBeInTheDocument();
        expect(screen.getByAltText('cover-a').parentElement).toHaveClass(`${prefix}-popup-content-cover`);
        expect(screen.queryByText('Title B')).toBeNull();
        expect(indicator()).toBe('1/3');
        const popover = $(`.${prefix}-popover`);
        expect(popover).toHaveClass('custom');
        expect(popover).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(popover).toHaveClass(`${BASE_CLASS_PREFIX}-popover-with-arrow`);
        expect(screen.getByRole('button', { name: '跳过' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '下一步' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: '上一步' })).toBeNull();
    });

    it('style 为字符串时与卡片的内置样式合并', async () => {
        renderGuide({ style: 'color: red', steps: makeSteps(), visible: true });
        await screen.findByText('Title A');
        expect($(`.${prefix}-popover`)).toHaveStyle({ color: 'rgb(255, 0, 0)', padding: '0px' });
    });

    it('单步骤时隐藏指示器，步骤要求时隐藏箭头', async () => {
        const target = makeTarget(0, 0, 10, 10);
        renderGuide({ steps: [{ target, title: 'Only', showArrow: false }], visible: true });
        await screen.findByText('Only');
        expect(indicator()).toBeUndefined();
        expect($(`.${prefix}-popover`)).not.toHaveClass(`${BASE_CLASS_PREFIX}-popover-with-arrow`);
        expect(screen.getByRole('button', { name: '完成' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: '跳过' })).toBeNull();
    });

    it('next、prev、skip 与 finish 触发回调并移动当前步骤', async () => {
        const onChange = vi.fn<NonNullable<UserGuideProps['onChange']>>();
        const onNext = vi.fn<NonNullable<UserGuideProps['onNext']>>();
        const onPrev = vi.fn<NonNullable<UserGuideProps['onPrev']>>();
        const onSkip = vi.fn<NonNullable<UserGuideProps['onSkip']>>();
        const onFinish = vi.fn<NonNullable<UserGuideProps['onFinish']>>();
        renderGuide({ steps: makeSteps(), visible: true, onChange, onFinish, onNext, onPrev, onSkip });
        await screen.findByText('Title A');
        fireEvent.click(screen.getByRole('button', { name: '跳过' }));
        expect(onSkip).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole('button', { name: '下一步' }));
        expect(onNext).toHaveBeenLastCalledWith(1);
        expect(onChange).toHaveBeenLastCalledWith(1);
        await screen.findByText('Title B');
        expect(indicator()).toBe('2/3');

        fireEvent.click(screen.getByRole('button', { name: '上一步' }));
        expect(onPrev).toHaveBeenLastCalledWith(0);
        expect(onChange).toHaveBeenLastCalledWith(0);
        await screen.findByText('Title A');

        fireEvent.click(screen.getByRole('button', { name: '下一步' }));
        await screen.findByText('Title B');
        fireEvent.click(screen.getByRole('button', { name: '下一步' }));
        await screen.findByText('Title C');
        expect(screen.queryByRole('button', { name: '跳过' })).toBeNull();
        expect(onChange).toHaveBeenCalledTimes(4);

        fireEvent.click(screen.getByRole('button', { name: '完成' }));
        expect(onFinish).toHaveBeenCalledTimes(1);
        expect(onNext).toHaveBeenCalledTimes(3);
        expect(onChange).toHaveBeenCalledTimes(4);
        expect(screen.getByText('Title C')).toBeInTheDocument();
    });

    it('受控 current 仅在属性变化时移动', async () => {
        const onChange = vi.fn<NonNullable<UserGuideProps['onChange']>>();
        const onNext = vi.fn<NonNullable<UserGuideProps['onNext']>>();
        const steps = makeSteps();
        const { rerender } = renderGuide({ current: 1, steps, visible: true, onChange, onNext });
        await screen.findByText('Title B');
        fireEvent.click(screen.getByRole('button', { name: '下一步' }));
        expect(onChange).toHaveBeenCalledWith(2);
        expect(onNext).toHaveBeenCalledWith(2);
        expect(screen.getByText('Title B')).toBeInTheDocument();
        expect(indicator()).toBe('2/3');

        rerender({ current: 2, steps, visible: true, onChange, onNext });
        await screen.findByText('Title C');
        expect(indicator()).toBe('3/3');

        fireEvent.click(screen.getByRole('button', { name: '上一步' }));
        expect(onChange).toHaveBeenLastCalledWith(1);
        expect(screen.getByText('Title C')).toBeInTheDocument();
    });

    it('关闭时隐藏全部内容，重新打开时从第一步开始', async () => {
        const steps = makeSteps();
        const { rerender } = renderGuide({ steps });
        rerender({ steps, visible: true });
        await screen.findByText('Title A');
        fireEvent.click(screen.getByRole('button', { name: '下一步' }));
        await screen.findByText('Title B');

        rerender({ steps, visible: false });
        expect(screen.queryByText('Title B')).toBeNull();
        expect($(`.${prefix}-spotlight`)).toBeNull();

        rerender({ steps, visible: true });
        await screen.findByText('Title A');
        expect(indicator()).toBe('1/3');
    });

    it('以默认 padding 在当前目标周围开出聚光区域，并跟随 current', async () => {
        renderGuide({ steps: makeSteps(), visible: true, zIndex: 2000 });
        await waitFor(() => expect(spotRect()).not.toBeNull());
        const svg = $(`.${prefix}-spotlight`);
        expect(svg.style.zIndex).toBe('2000');
        expect(rectOf(spotRect())).toEqual([5, 15, 110, 40]);
        expect(svg.querySelector('rect[mask]')).not.toBeNull();
        expect($$(`.${prefix}-spotlight-transparent-rect`)).toHaveLength(4);

        fireEvent.click(screen.getByRole('button', { name: '下一步' }));
        await waitFor(() => expect(rectOf(spotRect())).toEqual([195, 295, 60, 50]));
    });

    it('spotlightPadding 全局生效，步骤可覆盖', async () => {
        const steps = makeSteps();
        steps[1].spotlightPadding = 15;
        renderGuide({ spotlightPadding: 10, steps, visible: true });
        await waitFor(() => expect(rectOf(spotRect())).toEqual([0, 10, 120, 50]));
        fireEvent.click(screen.getByRole('button', { name: '下一步' }));
        await waitFor(() => expect(rectOf(spotRect())).toEqual([185, 285, 80, 70]));
    });

    it('mask={false} 保留镂空定义但不绘制遮罩', async () => {
        renderGuide({ mask: false, steps: makeSteps(), visible: true });
        await waitFor(() => expect(spotRect()).not.toBeNull());
        expect($(`.${prefix}-spotlight rect[mask]`)).toBeNull();
        expect($$(`.${prefix}-spotlight-transparent-rect`)).toHaveLength(0);
    });

    it('没有 target 的步骤不渲染 popover 与聚光区域', async () => {
        renderGuide({ steps: [{ title: 'Nowhere' }], visible: true });
        await sleep(20);
        expect(screen.queryByText('Nowhere')).toBeNull();
        expect($(`.${prefix}-spotlight`)).toBeNull();
    });

    it('主题可由组件或步骤设置为 primary', async () => {
        const steps = makeSteps();
        steps[1].theme = 'primary';
        renderGuide({ steps, visible: true });
        await screen.findByText('Title A');
        expect($(`.${prefix}-popup-content-primary`)).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: '下一步' }));
        await screen.findByText('Title B');
        expect($(`.${prefix}-popup-content-primary`)).not.toBeNull();
    });

    it('步骤的 theme 为 default 时覆盖全局的 primary', async () => {
        const steps = makeSteps();
        steps[1].theme = 'default';
        renderGuide({ steps, theme: 'primary', visible: true });
        await screen.findByText('Title A');
        expect($(`.${prefix}-popup-content-primary`)).not.toBeNull();
        fireEvent.click(screen.getByRole('button', { name: '下一步' }));
        await screen.findByText('Title B');
        expect($(`.${prefix}-popup-content-primary`)).toBeNull();
    });

    it('steps 在显示后才到达时，补上聚光区域', async () => {
        const steps = makeSteps();
        const { rerender } = renderGuide({ steps: [], visible: true });
        expect(spotRect()).toBeNull();
        rerender({ steps, visible: true });
        await waitFor(() => expect(rectOf(spotRect())).toEqual([5, 15, 110, 40]));
        await screen.findByText('Title A');
    });

    // nothing reactive changes when only the target mounts, so the next resize or scroll picks it up
    it('target 在显示后才挂载时，下一次缩放或滚动补上聚光区域', async () => {
        let target: Element | undefined;
        renderGuide({ steps: [{ target: () => target, title: 'Late' }], visible: true });
        expect(spotRect()).toBeNull();
        target = makeTarget(10, 20, 100, 30);
        fireEvent(window, new Event('resize'));
        await waitFor(() => expect(rectOf(spotRect())).toEqual([5, 15, 110, 40]));
    });

    it('切换到没有 target 的步骤时，不沿用上一步的聚光区域', async () => {
        const steps = makeSteps();
        renderGuide({ steps: [steps[0], { title: 'Nowhere' }], visible: true });
        await waitFor(() => expect(spotRect()).not.toBeNull());
        fireEvent.click(screen.getByRole('button', { name: '下一步' }));
        await waitFor(() => expect(spotRect()).toBeNull());
        expect(screen.queryByText('Nowhere')).toBeNull();
    });

    it('按钮文案、按钮属性与隐藏按钮', async () => {
        const onClick = vi.fn<ClickHandler>();
        const steps = makeSteps();
        const { rerender } = renderGuide({ current: 1, finishText: 'Done', nextButtonProps: { children: 'Forward' }, prevButtonProps: { children: 'Back', onClick }, steps, visible: true });
        await screen.findByText('Title B');
        expect(screen.getByRole('button', { name: 'Forward' })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Back' }));
        expect(onClick).toHaveBeenCalledTimes(1);

        rerender({ current: 2, finishText: 'Done', nextButtonProps: { children: 'Forward' }, steps, visible: true });
        await screen.findByText('Title C');
        expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();

        rerender({ current: 1, showPrevButton: false, showSkipButton: false, steps, visible: true });
        await screen.findByText('Title B');
        expect(screen.queryByRole('button', { name: '跳过' })).toBeNull();
        expect(screen.queryByRole('button', { name: '上一步' })).toBeNull();
    });

    it('按钮文案跟随语言包', async () => {
        const steps = makeSteps();
        const { rerender } = renderGuide({ current: 1, steps, visible: true }, withEnglish);
        await screen.findByText('Title B');
        for (const name of ['Skip', 'Prev', 'Next']) {
            expect(screen.getByRole('button', { name })).toBeInTheDocument();
        }
        rerender({ current: 2, steps, visible: true });
        expect(await screen.findByRole('button', { name: 'Finish' })).toBeInTheDocument();
    });

    it('显示时锁定 body 滚动，关闭与卸载时恢复', () => {
        const steps = makeSteps();
        const { rerender, unmount } = renderGuide({ steps });
        expect(document.body.style.overflow).toBe('');
        rerender({ steps, visible: true });
        expect(document.body.style.overflow).toBe('hidden');
        rerender({ steps, visible: false });
        expect(document.body.style.overflow).toBe('');

        rerender({ steps, visible: true });
        expect(document.body.style.overflow).toBe('hidden');
        unmount();
        expect(document.body.style.overflow).toBe('');
    });

    it('getPopupContainer 指向 body 时与未设置一样锁定 body 滚动', () => {
        const steps = makeSteps();
        const getPopupContainer = () => document.body;
        const { rerender } = renderGuide({ getPopupContainer, steps });
        rerender({ getPopupContainer, steps, visible: true });
        expect(document.body.style.overflow).toBe('hidden');
        rerender({ getPopupContainer, steps, visible: false });
        expect(document.body.style.overflow).toBe('');
    });

    it('getPopupContainer 指向其他元素或 overflow 已为 hidden 时不改动 body 滚动', () => {
        const steps = makeSteps();
        const host = document.body.appendChild(document.createElement('div'));
        const getPopupContainer = () => host;
        const { rerender } = renderGuide({ getPopupContainer, steps });
        rerender({ getPopupContainer, steps, visible: true });
        expect(document.body.style.overflow).toBe('');
        rerender({ getPopupContainer, steps, visible: false });

        document.body.style.overflow = 'hidden';
        rerender({ steps });
        rerender({ steps, visible: true });
        rerender({ steps, visible: false });
        expect(document.body.style.overflow).toBe('hidden');
        host.remove();
    });

    it('ConfigProvider 的 getPopupContainer 指向其他元素时不锁定 body 滚动', () => {
        const host = document.body.appendChild(document.createElement('div'));
        render(() => (
            <ConfigProvider getPopupContainer={() => host}>
                <UserGuide mode="modal" steps={makeSteps()} visible />
            </ConfigProvider>
        ));
        expect(host.querySelector(`.${BASE_CLASS_PREFIX}-modal`)).not.toBeNull();
        expect(document.body.style.overflow).toBe('');
        host.remove();
    });

    it('没有可显示的步骤时不锁定 body 滚动', async () => {
        const { rerender } = renderGuide({ steps: [], visible: true });
        expect(document.body.style.overflow).toBe('');
        rerender({ steps: [{ title: 'Nowhere' }], visible: true });
        await sleep(20);
        expect(document.body.style.overflow).toBe('');
        rerender({ steps: makeSteps(), visible: true });
        await waitFor(() => expect(document.body.style.overflow).toBe('hidden'));
    });

    it('与 Modal 交错打开关闭时，最后一个关闭前 body 保持锁定', () => {
        const steps = makeSteps();
        const [guide, setGuide] = createSignal(true);
        const [modal, setModal] = createSignal(true);
        render(() => (
            <>
                <UserGuide steps={steps} visible={guide()} />
                <Modal title="Dialog" motion={false} visible={modal()} />
            </>
        ));
        expect(document.body.style.overflow).toBe('hidden');
        setGuide(false);
        expect(document.body.style.overflow).toBe('hidden');
        setModal(false);
        expect(document.body.style.overflow).toBe('');
    });
});

describe('传递到各层的 UserGuide 属性', () => {
    it('移除受控 current 时从上一个受控步骤继续', async () => {
        const steps = makeSteps();
        const { rerender } = renderGuide({ current: 0, steps, visible: true });
        await screen.findByText('Title A');
        rerender({ current: 2, steps, visible: true });
        await screen.findByText('Title C');
        rerender({ steps, visible: true });
        expect(screen.getByText('Title C')).toBeInTheDocument();
        expect(indicator()).toBe('3/3');
    });

    it('父组件挂载时就改了受控 current，移除后从该步骤继续', async () => {
        const steps = makeSteps();
        const [current, setCurrent] = createSignal<number | undefined>(0);
        function Demo() {
            onMount(() => setCurrent(2));
            return <UserGuide current={current()} steps={steps} visible />;
        }
        render(() => <Demo />);
        await screen.findByText('Title C');
        setCurrent(undefined);
        await sleep(0);
        expect(screen.getByText('Title C')).toBeInTheDocument();
    });

    it('步骤的 mask 覆盖全局 mask', async () => {
        const steps = makeSteps();
        steps[1].mask = false;
        const { rerender } = renderGuide({ current: 1, steps, visible: true });
        await waitFor(() => expect(spotRect()).not.toBeNull());
        expect($(`.${prefix}-spotlight rect[mask]`)).toBeNull();
        rerender({ current: 0, steps, visible: true });
        await waitFor(() => expect($(`.${prefix}-spotlight rect[mask]`)).not.toBeNull());
        rerender({ current: 0, mask: false, steps: steps.map((step, i) => (i === 0 ? { ...step, mask: true } : step)), visible: true });
        await waitFor(() => expect($(`.${prefix}-spotlight rect[mask]`)).not.toBeNull());
    });

    it('步骤的 class 应用到 popover', async () => {
        const steps = makeSteps();
        steps[0].class = 'step-cls';
        renderGuide({ class: 'guide-cls', steps, visible: true });
        await screen.findByText('Title A');
        expect($(`.${prefix}-popover`)).toHaveClass('guide-cls', 'step-cls');
    });

    it('getPopupContainer 与 zIndex 只作用于遮罩，不作用于 top layer 中的 popover', async () => {
        const container = document.body.appendChild(document.createElement('div'));
        renderGuide({ getPopupContainer: () => container, steps: makeSteps(), visible: true, zIndex: 2000 });
        await screen.findByText('Title A');
        expect(container.contains(screen.getByText('Title A'))).toBe(false);
        expect($(`.${prefix}-popover`).style.zIndex).not.toBe('2000');
        expect($(`.${prefix}-spotlight`).style.zIndex).toBe('2000');
        container.remove();
    });

    it('modal 模式接收 class、style、步骤 mask、getPopupContainer 与 zIndex', async () => {
        const container = document.body.appendChild(document.createElement('div'));
        const steps = makeSteps();
        steps[0].class = 'step-cls';
        steps[0].mask = false;
        renderGuide({ class: 'guide-cls', style: { color: 'red' }, getPopupContainer: () => container, mode: 'modal', steps, visible: true, zIndex: 2000 });
        await screen.findByText('Title A');
        const modal = $(`.${prefix}-modal`);
        expect(modal).toHaveClass('guide-cls', 'step-cls');
        expect(modal.querySelector(`.${BASE_CLASS_PREFIX}-modal`)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(container.contains(modal)).toBe(true);
        expect(modal.closest<HTMLElement>(`.${BASE_CLASS_PREFIX}-portal`)?.style.zIndex).toBe('2000');
        expect($(`.${BASE_CLASS_PREFIX}-modal-mask`)).toBeNull();
        container.remove();
    });

    it('未声明的属性被丢弃，不落到任何元素上', async () => {
        renderGuide({ steps: makeSteps(), visible: true, ...({ 'data-foo': 'bar', id: 'guide' } as object) });
        await screen.findByText('Title A');
        expect(document.querySelector('[data-foo]')).toBeNull();
        expect(document.getElementById('guide')).toBeNull();
    });
});

describe('UserGuide 测量', () => {
    it('窗口缩放及任意容器内滚动时重新计算聚光区域', async () => {
        const steps = makeSteps();
        renderGuide({ steps, visible: true });
        await waitFor(() => expect(rectOf(spotRect())).toEqual([5, 15, 110, 40]));
        targetOf(steps[0]).rect = { x: 30, y: 40, width: 100, height: 30 };
        fireEvent(window, new Event('resize'));
        await waitFor(() => expect(rectOf(spotRect())).toEqual([25, 35, 110, 40]));
        targetOf(steps[0]).rect = { x: 30, y: 10, width: 100, height: 30 };
        fireEvent.scroll(targetOf(steps[2]));
        await waitFor(() => expect(rectOf(spotRect())).toEqual([25, 5, 110, 40]));
    });

    it('关闭或卸载后停止测量', async () => {
        const steps = makeSteps();
        const measure = vi.spyOn(targetOf(steps[0]), 'getBoundingClientRect');
        const { rerender, unmount } = renderGuide({ steps, visible: true });
        await waitFor(() => expect(spotRect()).not.toBeNull());
        rerender({ steps, visible: false });
        measure.mockClear();
        fireEvent(window, new Event('resize'));
        expect(measure).not.toHaveBeenCalled();

        rerender({ steps, visible: true });
        await waitFor(() => expect(spotRect()).not.toBeNull());
        unmount();
        measure.mockClear();
        fireEvent(window, new Event('resize'));
        fireEvent.scroll(document);
        expect(measure).not.toHaveBeenCalled();
    });

    it('spotlightPadding={0} 表示无内边距，而非默认值', async () => {
        renderGuide({ spotlightPadding: 0, steps: makeSteps(), visible: true });
        await waitFor(() => expect(rectOf(spotRect())).toEqual([10, 20, 100, 30]));
    });

    it('关闭时恢复 body 的结束内边距', () => {
        const steps = makeSteps();
        document.body.style.paddingInlineEnd = '4px';
        const { rerender } = renderGuide({ steps });
        rerender({ steps, visible: true });
        expect(document.body.style.paddingInlineEnd).not.toBe('4px');
        rerender({ steps, visible: false });
        expect(document.body.style.paddingInlineEnd).toBe('4px');
        document.body.style.paddingInlineEnd = '';
    });

    it('挂载时已可见则锁定 body 滚动', () => {
        const { unmount } = renderGuide({ steps: makeSteps(), visible: true });
        expect(document.body.style.overflow).toBe('hidden');
        unmount();
        expect(document.body.style.overflow).toBe('');
    });

    it('无步骤时切换 visible 不报错', async () => {
        const { rerender } = renderGuide({ steps: [] });
        rerender({ steps: [], visible: true });
        await sleep(20);
        expect($(`.${prefix}-spotlight`)).toBeNull();
    });

    it('受控 current 超出 steps 范围时不渲染且不抛错', () => {
        const steps = makeSteps();
        renderGuide({ current: 5, steps, visible: true });
        renderGuide({ current: 5, mode: 'modal', steps, visible: true });
        expect($(`.${prefix}-popover`)).toBeNull();
        expect($(`.${prefix}-modal`)).toBeNull();
    });

    it('读取 semiGlobal.config.overrideDefaultProps', async () => {
        semiGlobal.config.overrideDefaultProps = { UserGuide: { showSkipButton: false, finishText: 'All done' } };
        try {
            renderGuide({ current: 2, steps: makeSteps(), visible: true });
            expect(await screen.findByRole('button', { name: 'All done' })).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: '跳过' })).toBeNull();
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });
});

describe('UserGuide 弹窗模式', () => {
    const modalPrefix = `${prefix}-modal`;
    const activeDot = () => [...$$(`.${modalPrefix}-indicator-item`)].findIndex((dot) => dot.classList.contains(`${modalPrefix}-indicator-item-active`));

    it('在弹窗中渲染封面、指示器、标题与描述，并可逐步切换', async () => {
        const onNext = vi.fn<NonNullable<UserGuideProps['onNext']>>();
        const onFinish = vi.fn<NonNullable<UserGuideProps['onFinish']>>();
        renderGuide({ mode: 'modal', steps: makeSteps(), visible: true, renderCover: firstCover, onFinish, onNext });
        await screen.findByText('Title A');
        expect($(`.${modalPrefix}`)).not.toBeNull();
        expect($(`.${prefix}-spotlight`)).toBeNull();
        expect($(`.${prefix}-popover`)).toBeNull();
        expect(screen.getByAltText('cover-a').parentElement).toHaveClass(`${modalPrefix}-cover`);
        expect($$(`.${modalPrefix}-indicator-item`)).toHaveLength(3);
        expect(activeDot()).toBe(0);
        expect(screen.getByText('Title A')).toHaveClass(`${modalPrefix}-body-title`);
        expect(screen.getByText('Desc A')).toHaveClass(`${modalPrefix}-body-description`);
        expect(screen.queryByRole('button', { name: '上一步' })).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: '下一步' }));
        expect(onNext).toHaveBeenCalledWith(1);
        await screen.findByText('Title B');
        expect($(`.${modalPrefix}-cover`)).toBeNull();
        expect(screen.getByRole('button', { name: '上一步' })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: '下一步' }));
        await screen.findByText('Title C');
        fireEvent.click(screen.getByRole('button', { name: '完成' }));
        expect(onFinish).toHaveBeenCalledTimes(1);
    });

    it('渲染函数只为当前步骤调用，内容为空时回落到步骤的文字', async () => {
        const indices = new Set<number>();
        const custom = (text: string) => (step: StepRenderProps) => {
            indices.add(step.index);
            return (
                <Show when={step.index === 0}>
                    <b>{text}</b>
                </Show>
            );
        };
        renderGuide({ mode: 'modal', steps: makeSteps(), visible: true, renderCover: custom('Cover'), renderDescription: custom('Custom desc'), renderTitle: custom('Custom title') });
        await screen.findByText('Custom title');
        expect(screen.getByText('Cover').parentElement).toHaveClass(`${modalPrefix}-cover`);
        expect(screen.getByText('Custom title').parentElement).toHaveClass(`${modalPrefix}-body-title`);
        expect(screen.getByText('Custom desc').parentElement).toHaveClass(`${modalPrefix}-body-description`);
        expect(screen.queryByText('Title A')).toBeNull();
        expect(screen.getByRole('dialog')).toHaveAccessibleName('Custom title');
        expect([...indices]).toEqual([0]);

        fireEvent.click(screen.getByRole('button', { name: '下一步' }));
        await screen.findByText('Title B');
        expect(screen.getByText('Desc B')).toHaveClass(`${modalPrefix}-body-description`);
        expect($(`.${modalPrefix}-cover`)).toBeNull();
        expect([...indices]).toEqual([0, 1]);
    });

    it('步骤数据只收文字，节点交给渲染函数', () => {
        const steps: StepItem[] = [
            // @ts-expect-error title is text; nodes go through renderTitle
            { title: <b>Title</b> },
            // @ts-expect-error cover is rendered by renderCover
            { cover: <img alt="cover" /> },
        ];
        expect(steps).toHaveLength(2);
    });

    it('指示器跟随受控 current', async () => {
        const steps = makeSteps();
        const renderCover = ({ item }: StepRenderProps) => <img alt={`cover-${item.title}`} />;
        const { rerender } = renderGuide({ current: 0, mode: 'modal', steps, visible: true, renderCover });
        await screen.findByText('Title A');
        expect(activeDot()).toBe(0);
        rerender({ current: 2, mode: 'modal', steps, visible: true, renderCover });
        await screen.findByText('Title C');
        expect(activeDot()).toBe(2);
        expect(screen.getByRole('button', { name: '完成' })).toBeInTheDocument();
    });

    it('skip、自定义文案与语言包', async () => {
        const onSkip = vi.fn<NonNullable<UserGuideProps['onSkip']>>();
        const steps = makeSteps();
        const { rerender } = renderGuide({ current: 1, mode: 'modal', steps, visible: true, onSkip }, withEnglish);
        await screen.findByText('Title B');
        fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
        expect(onSkip).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button', { name: 'Prev' })).toBeInTheDocument();
        rerender({ current: 2, finishText: 'Done', mode: 'modal', steps, visible: true });
        expect(await screen.findByRole('button', { name: 'Done' })).toBeInTheDocument();
    });

    it('步骤标题为对话框命名，且不产生缺少名称的警告', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            const steps = makeSteps();
            const { rerender } = renderGuide({ current: 0, mode: 'modal', steps, visible: true });
            expect(await screen.findByRole('dialog', { name: 'Title A' })).toBeInTheDocument();
            rerender({ current: 1, mode: 'modal', steps, visible: true });
            expect(await screen.findByRole('dialog', { name: 'Title B' })).toBeInTheDocument();
            await sleep(0);
            expect(warn.mock.calls.filter(([message]) => String(message).includes('accessible name'))).toHaveLength(0);
        } finally {
            warn.mockRestore();
        }
    });

    it('按 Escape 跳过引导，最后一步同样生效', async () => {
        const onSkip = vi.fn<NonNullable<UserGuideProps['onSkip']>>();
        const onFinish = vi.fn<NonNullable<UserGuideProps['onFinish']>>();
        const steps = makeSteps();
        const { unmount } = renderGuide({ current: 0, mode: 'modal', steps, visible: true, onFinish, onSkip });
        await screen.findByRole('dialog');
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onSkip).toHaveBeenCalledTimes(1);
        // a new Modal: the cancel of one Modal is debounced
        unmount();
        renderGuide({ current: 2, mode: 'modal', steps, visible: true, onFinish, onSkip });
        await screen.findByText('Title C');
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onSkip).toHaveBeenCalledTimes(2);
        expect(onFinish).not.toHaveBeenCalled();
    });
});

describe('UserGuide 弹出模式的 Escape 与名称', () => {
    it('按 Escape 跳过引导，最后一步同样生效', async () => {
        const onSkip = vi.fn<NonNullable<UserGuideProps['onSkip']>>();
        const onFinish = vi.fn<NonNullable<UserGuideProps['onFinish']>>();
        renderGuide({ current: 2, steps: makeSteps(), visible: true, onFinish, onSkip });
        await screen.findByText('Title C');
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onSkip).toHaveBeenCalledTimes(1);
        expect(onFinish).not.toHaveBeenCalled();
    });

    it('步骤标题为弹出对话框命名', async () => {
        renderGuide({ steps: makeSteps(), visible: true });
        expect(await screen.findByRole('dialog', { name: 'Title A' })).toBeInTheDocument();
    });
});

describe('UserGuide 按钮属性', () => {
    it('使用方的 onClick 先于内置处理执行，不替换内置处理', async () => {
        const onClick = vi.fn<ClickHandler>();
        const onNext = vi.fn<NonNullable<UserGuideProps['onNext']>>();
        const onFinish = vi.fn<NonNullable<UserGuideProps['onFinish']>>();
        const steps = makeSteps();
        const { rerender } = renderGuide({ nextButtonProps: { onClick }, steps, visible: true, onFinish, onNext });
        await screen.findByText('Title A');
        fireEvent.click(screen.getByRole('button', { name: '下一步' }));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onNext).toHaveBeenCalledWith(1);
        await screen.findByText('Title B');

        rerender({ current: 2, nextButtonProps: { onClick }, steps, visible: true, onFinish });
        await screen.findByText('Title C');
        fireEvent.click(screen.getByRole('button', { name: '完成' }));
        expect(onFinish).toHaveBeenCalledTimes(1);
    });

    it('使用方的 style 与内置 style 合并，同名字段以使用方为准', async () => {
        renderGuide({ nextButtonProps: { style: { color: 'red' } }, steps: makeSteps().map((step) => ({ ...step, theme: 'primary' as const })), visible: true });
        const next = await screen.findByRole('button', { name: '下一步' });
        expect(next.style.color).toBe('red');
        expect(next.style.backgroundColor).toBe('var(--semi-color-white)');
    });

    it('弹窗模式的按钮同样先调用使用方的 onClick', async () => {
        const onClick = vi.fn<ClickHandler>();
        const onNext = vi.fn<NonNullable<UserGuideProps['onNext']>>();
        renderGuide({ mode: 'modal', nextButtonProps: { onClick }, steps: makeSteps(), visible: true, onNext });
        fireEvent.click(await screen.findByRole('button', { name: '下一步' }));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onNext).toHaveBeenCalledWith(1);
    });
});

describe('UserGuide 无障碍与滚动锁', () => {
    it('弹出模式的定位锚点不是 Tab 停靠点', async () => {
        renderGuide({ steps: makeSteps(), visible: true });
        await screen.findByText('Title A');
        const anchor = $('div[style*="pointer-events: none"]');
        expect(anchor).not.toBeNull();
        expect(anchor).toHaveAttribute('tabindex', '-1');
    });

    it('没有遮罩时不锁定 body 滚动', async () => {
        const { rerender } = renderGuide({ mask: false, steps: makeSteps(), visible: true });
        await screen.findByText('Title A');
        expect(document.body.style.overflow).toBe('');
        rerender({ mask: false, mode: 'modal', steps: makeSteps(), visible: true });
        await screen.findByText('Title A');
        expect(document.body.style.overflow).toBe('');
    });

    it('步骤切换到无遮罩的步骤时释放滚动锁', async () => {
        const steps = makeSteps();
        steps[1].mask = false;
        const { rerender } = renderGuide({ current: 0, steps, visible: true });
        await screen.findByText('Title A');
        expect(document.body.style.overflow).toBe('hidden');
        rerender({ current: 1, steps, visible: true });
        await screen.findByText('Title B');
        expect(document.body.style.overflow).toBe('');
    });

    it('弹窗模式打开时聚焦主按钮', async () => {
        const steps = makeSteps();
        const { rerender } = renderGuide({ current: 0, mode: 'modal', steps, visible: true });
        const next = await screen.findByRole('button', { name: '下一步' });
        await waitFor(() => expect(next).toHaveFocus());
        rerender({ current: 2, mode: 'modal', steps, visible: true });
        const finish = await screen.findByRole('button', { name: '完成' });
        await waitFor(() => expect(finish).toHaveFocus());
    });

    it('弹窗模式向读屏暴露「当前/总数」，圆点本身对读屏隐藏', async () => {
        const steps = makeSteps();
        const renderCover = () => <img alt="cover" />;
        const { rerender } = renderGuide({ current: 0, mode: 'modal', steps, visible: true, renderCover });
        await screen.findByText('Title A');
        expect(screen.getByText('1/3')).toHaveClass(`${prefix}-modal-progress`);
        expect($(`.${prefix}-modal-indicator`)).toHaveAttribute('aria-hidden', 'true');
        rerender({ current: 1, mode: 'modal', steps, visible: true, renderCover });
        await screen.findByText('Title B');
        expect(screen.getByText('2/3')).toBeInTheDocument();
    });
});
