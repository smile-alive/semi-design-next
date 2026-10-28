import { StrictMode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { ConfigProvider, UserGuide, LocaleProvider, Modal } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { ButtonProps } from '@fibrae/semi-ui-react/button';
import type { StepItem, UserGuideProps } from '../index';

let popoverProps: object = {};
vi.mock('@fibrae/semi-ui-react/popover', async (importOriginal) => {
    const { createElement } = await import('react');
    const actual = await importOriginal<typeof import('@fibrae/semi-ui-react/popover')>();
    return {
        ...actual,
        default: (props) => {
            popoverProps = props;
            return createElement(actual.default, props);
        },
    };
});

const prefix = `${BASE_CLASS_PREFIX}-userGuide`;
const $ = (selector: string) => document.querySelector<HTMLElement>(selector);
const $$ = (selector) => document.querySelectorAll(selector);

type TestTarget = HTMLDivElement & { rect: { x: number; y: number; width: number; height: number } };

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
        { target: a, title: 'Title A', description: 'Desc A', cover: <img alt="cover-a" /> },
        { target: () => b, title: 'Title B', description: 'Desc B' },
        { target: c, title: 'Title C', description: 'Desc C' },
    ];
}

const spotRect = () => $(`.${prefix}-spotlight-rect`);
const rectOf = (el) => ['x', 'y', 'width', 'height'].map((key) => Number(el.getAttribute(key)));
const indicator = () => $(`.${prefix}-popup-content-indicator`)?.textContent;

afterEach(() => {
    for (const el of targets) {
        el.remove();
    }
    targets = [];
    document.body.removeAttribute('style');
});

describe('UserGuide 弹出模式', () => {
    it('隐藏或无步骤时不渲染任何内容', () => {
        const steps = makeSteps();
        const { unmount } = render(<UserGuide steps={steps} />);
        expect($(`.${prefix}-popover`)).toBeNull();
        expect($(`.${prefix}-spotlight`)).toBeNull();
        unmount();
        render(<UserGuide steps={[]} visible />);
        expect($(`.${prefix}-popover`)).toBeNull();
        expect($(`.${prefix}-spotlight`)).toBeNull();
    });

    it('在 popover 中渲染当前步骤，并应用 className 与 style', async () => {
        render(<UserGuide className="custom" style={{ color: 'red' }} steps={makeSteps()} visible />);
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

    it('单步骤时隐藏指示器，步骤要求时隐藏箭头', async () => {
        const target = makeTarget(0, 0, 10, 10);
        render(<UserGuide steps={[{ target, title: 'Only', showArrow: false }]} visible />);
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
        render(<UserGuide steps={makeSteps()} visible onChange={onChange} onFinish={onFinish} onNext={onNext} onPrev={onPrev} onSkip={onSkip} />);
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
        const { rerender } = render(<UserGuide current={1} steps={steps} visible onChange={onChange} onNext={onNext} />);
        await screen.findByText('Title B');
        fireEvent.click(screen.getByRole('button', { name: '下一步' }));
        expect(onChange).toHaveBeenCalledWith(2);
        expect(onNext).toHaveBeenCalledWith(2);
        expect(screen.getByText('Title B')).toBeInTheDocument();
        expect(indicator()).toBe('2/3');

        rerender(<UserGuide current={2} steps={steps} visible onChange={onChange} onNext={onNext} />);
        await screen.findByText('Title C');
        expect(indicator()).toBe('3/3');

        fireEvent.click(screen.getByRole('button', { name: '上一步' }));
        expect(onChange).toHaveBeenLastCalledWith(1);
        expect(screen.getByText('Title C')).toBeInTheDocument();
    });

    it('关闭时隐藏全部内容，重新打开时从第一步开始', async () => {
        const steps = makeSteps();
        const { rerender } = render(<UserGuide steps={steps} />);
        rerender(<UserGuide steps={steps} visible />);
        await screen.findByText('Title A');
        fireEvent.click(screen.getByRole('button', { name: '下一步' }));
        await screen.findByText('Title B');

        rerender(<UserGuide steps={steps} visible={false} />);
        expect(screen.queryByText('Title B')).toBeNull();
        expect($(`.${prefix}-spotlight`)).toBeNull();

        rerender(<UserGuide steps={steps} visible />);
        await screen.findByText('Title A');
        expect(indicator()).toBe('1/3');
    });

    it('以默认 padding 在当前目标周围开出聚光区域，并跟随 current', async () => {
        render(<UserGuide steps={makeSteps()} visible zIndex={2000} />);
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
        render(<UserGuide spotlightPadding={10} steps={steps} visible />);
        await waitFor(() => expect(rectOf(spotRect())).toEqual([0, 10, 120, 50]));
        fireEvent.click(screen.getByRole('button', { name: '下一步' }));
        await waitFor(() => expect(rectOf(spotRect())).toEqual([185, 285, 80, 70]));
    });

    it('mask={false} 保留镂空定义但不绘制遮罩', async () => {
        render(<UserGuide mask={false} steps={makeSteps()} visible />);
        await waitFor(() => expect(spotRect()).not.toBeNull());
        expect($(`.${prefix}-spotlight rect[mask]`)).toBeNull();
        expect($$(`.${prefix}-spotlight-transparent-rect`)).toHaveLength(0);
    });

    it('没有 target 的步骤不渲染 popover 与聚光区域', async () => {
        render(<UserGuide steps={[{ title: 'Nowhere' }]} visible />);
        await new Promise((resolve) => requestAnimationFrame(resolve));
        expect(screen.queryByText('Nowhere')).toBeNull();
        expect($(`.${prefix}-spotlight`)).toBeNull();
    });

    it('主题可由组件或步骤设置为 primary', async () => {
        const steps = makeSteps();
        steps[1].theme = 'primary';
        render(<UserGuide steps={steps} visible />);
        await screen.findByText('Title A');
        expect($(`.${prefix}-popup-content-primary`)).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: '下一步' }));
        await screen.findByText('Title B');
        expect($(`.${prefix}-popup-content-primary`)).not.toBeNull();
    });

    it('步骤的 theme 为 default 时覆盖全局的 primary', async () => {
        const steps = makeSteps();
        steps[1].theme = 'default';
        render(<UserGuide steps={steps} theme="primary" visible />);
        await screen.findByText('Title A');
        expect($(`.${prefix}-popup-content-primary`)).not.toBeNull();
        fireEvent.click(screen.getByRole('button', { name: '下一步' }));
        await screen.findByText('Title B');
        expect($(`.${prefix}-popup-content-primary`)).toBeNull();
    });

    it('steps 在显示后才到达时，补上聚光区域', async () => {
        const steps = makeSteps();
        const { rerender } = render(<UserGuide steps={[]} visible />);
        expect(spotRect()).toBeNull();
        rerender(<UserGuide steps={steps} visible />);
        await waitFor(() => expect(rectOf(spotRect())).toEqual([5, 15, 110, 40]));
        await screen.findByText('Title A');
    });

    it('target 在显示后才挂载时，补上聚光区域', async () => {
        let target: Element | undefined;
        const steps: StepItem[] = [{ target: () => target, title: 'Late' }];
        const { rerender } = render(<UserGuide steps={steps} visible />);
        expect(spotRect()).toBeNull();
        target = makeTarget(10, 20, 100, 30);
        rerender(<UserGuide steps={steps} visible />);
        await waitFor(() => expect(rectOf(spotRect())).toEqual([5, 15, 110, 40]));
    });

    it('切换到没有 target 的步骤时，不沿用上一步的聚光区域', async () => {
        const steps = makeSteps();
        const withoutTarget: StepItem[] = [steps[0], { title: 'Nowhere' }];
        render(<UserGuide steps={withoutTarget} visible />);
        await waitFor(() => expect(spotRect()).not.toBeNull());
        fireEvent.click(screen.getByRole('button', { name: '下一步' }));
        await waitFor(() => expect(spotRect()).toBeNull());
        expect(screen.queryByText('Nowhere')).toBeNull();
    });

    it('按钮文案、按钮属性与隐藏按钮', async () => {
        const onClick = vi.fn<NonNullable<ButtonProps['onClick']>>();
        const steps = makeSteps();
        const { rerender } = render(<UserGuide current={1} finishText="Done" nextButtonProps={{ children: 'Forward' }} prevButtonProps={{ children: 'Back', onClick }} steps={steps} visible />);
        await screen.findByText('Title B');
        expect(screen.getByRole('button', { name: 'Forward' })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Back' }));
        expect(onClick).toHaveBeenCalledTimes(1);

        rerender(<UserGuide current={2} finishText="Done" steps={steps} visible />);
        await screen.findByText('Title C');
        expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();

        rerender(<UserGuide current={1} showPrevButton={false} showSkipButton={false} steps={steps} visible />);
        await screen.findByText('Title B');
        expect(screen.queryByRole('button', { name: '跳过' })).toBeNull();
        expect(screen.queryByRole('button', { name: '上一步' })).toBeNull();
    });

    it('按钮文案跟随语言包', async () => {
        const steps = makeSteps();
        const { rerender } = render(
            <LocaleProvider locale={en_US}>
                <UserGuide current={1} steps={steps} visible />
            </LocaleProvider>
        );
        await screen.findByText('Title B');
        for (const name of ['Skip', 'Prev', 'Next']) {
            expect(screen.getByRole('button', { name })).toBeInTheDocument();
        }
        rerender(
            <LocaleProvider locale={en_US}>
                <UserGuide current={2} steps={steps} visible />
            </LocaleProvider>
        );
        expect(await screen.findByRole('button', { name: 'Finish' })).toBeInTheDocument();
    });

    it('显示时锁定 body 滚动，关闭与卸载时恢复', async () => {
        const steps = makeSteps();
        const { rerender, unmount } = render(<UserGuide steps={steps} />);
        expect(document.body.style.overflow).toBe('');
        rerender(<UserGuide steps={steps} visible />);
        expect(document.body.style.overflow).toBe('hidden');
        rerender(<UserGuide steps={steps} visible={false} />);
        expect(document.body.style.overflow).toBe('');

        rerender(<UserGuide steps={steps} visible />);
        expect(document.body.style.overflow).toBe('hidden');
        unmount();
        expect(document.body.style.overflow).toBe('');
    });

    it('getPopupContainer 指向 body 时与未设置一样锁定 body 滚动', () => {
        const steps = makeSteps();
        const container = () => document.body;
        const { rerender } = render(<UserGuide getPopupContainer={container} steps={steps} />);
        rerender(<UserGuide getPopupContainer={container} steps={steps} visible />);
        expect(document.body.style.overflow).toBe('hidden');
        rerender(<UserGuide getPopupContainer={container} steps={steps} visible={false} />);
        expect(document.body.style.overflow).toBe('');
    });

    it('getPopupContainer 指向其他元素或 overflow 已为 hidden 时不改动 body 滚动', () => {
        const steps = makeSteps();
        const host = document.body.appendChild(document.createElement('div'));
        const container = () => host;
        const { rerender } = render(<UserGuide getPopupContainer={container} steps={steps} />);
        rerender(<UserGuide getPopupContainer={container} steps={steps} visible />);
        expect(document.body.style.overflow).toBe('');
        rerender(<UserGuide getPopupContainer={container} steps={steps} visible={false} />);

        document.body.style.overflow = 'hidden';
        rerender(<UserGuide steps={steps} />);
        rerender(<UserGuide steps={steps} visible />);
        rerender(<UserGuide steps={steps} visible={false} />);
        expect(document.body.style.overflow).toBe('hidden');
        host.remove();
    });

    it('ConfigProvider 的 getPopupContainer 指向其他元素时不锁定 body 滚动', () => {
        const host = document.body.appendChild(document.createElement('div'));
        render(
            <ConfigProvider getPopupContainer={() => host}>
                <UserGuide mode="modal" steps={makeSteps()} visible />
            </ConfigProvider>
        );
        expect(host.querySelector(`.${BASE_CLASS_PREFIX}-modal`)).not.toBeNull();
        expect(document.body.style.overflow).toBe('');
        host.remove();
    });

    it('没有可显示的步骤时不锁定 body 滚动', async () => {
        const { rerender } = render(<UserGuide steps={[]} visible />);
        expect(document.body.style.overflow).toBe('');
        rerender(<UserGuide steps={[{ title: 'Nowhere' }]} visible />);
        await new Promise((resolve) => requestAnimationFrame(resolve));
        expect(document.body.style.overflow).toBe('');
        rerender(<UserGuide steps={makeSteps()} visible />);
        await waitFor(() => expect(document.body.style.overflow).toBe('hidden'));
    });

    it('与 Modal 交错打开关闭时，最后一个关闭前 body 保持锁定', () => {
        const steps = makeSteps();
        const page = (guide: boolean, modal: boolean) => (
            <>
                <UserGuide steps={steps} visible={guide} />
                <Modal title="Dialog" motion={false} visible={modal} />
            </>
        );
        const { rerender } = render(page(true, true));
        expect(document.body.style.overflow).toBe('hidden');
        rerender(page(false, true));
        expect(document.body.style.overflow).toBe('hidden');
        rerender(page(false, false));
        expect(document.body.style.overflow).toBe('');
    });

    it('StrictMode 下每次点击只前进一步，且只触发一次 change 回调', async () => {
        const onChange = vi.fn<NonNullable<UserGuideProps['onChange']>>();
        const steps = makeSteps();
        const ui = (visible) => (
            <StrictMode>
                <UserGuide steps={steps} visible={visible} onChange={onChange} />
            </StrictMode>
        );
        const { rerender } = render(ui(false));
        rerender(ui(true));
        await screen.findByText('Title A');
        expect(document.body.style.overflow).toBe('hidden');
        fireEvent.click(screen.getByRole('button', { name: '下一步' }));
        await screen.findByText('Title B');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(1);
        await waitFor(() => expect(rectOf(spotRect())).toEqual([195, 295, 60, 50]));
        rerender(ui(false));
        expect(document.body.style.overflow).toBe('');
    });
});

describe('传递到各层的 UserGuide 属性', () => {
    it('移除受控 current 时从上一个受控步骤继续', async () => {
        const steps = makeSteps();
        const { rerender } = render(<UserGuide current={0} steps={steps} visible />);
        await screen.findByText('Title A');
        rerender(<UserGuide current={2} steps={steps} visible />);
        await screen.findByText('Title C');
        rerender(<UserGuide steps={steps} visible />);
        expect(screen.getByText('Title C')).toBeInTheDocument();
        expect(indicator()).toBe('3/3');
    });

    it('步骤的 mask 覆盖全局 mask', async () => {
        const steps = makeSteps();
        steps[1].mask = false;
        const { rerender } = render(<UserGuide current={1} steps={steps} visible />);
        await waitFor(() => expect(spotRect()).not.toBeNull());
        expect($(`.${prefix}-spotlight rect[mask]`)).toBeNull();
        rerender(<UserGuide current={0} steps={steps} visible />);
        await waitFor(() => expect($(`.${prefix}-spotlight rect[mask]`)).not.toBeNull());
        steps[0].mask = true;
        rerender(<UserGuide current={0} mask={false} steps={steps} visible />);
        await waitFor(() => expect($(`.${prefix}-spotlight rect[mask]`)).not.toBeNull());
    });

    it('步骤的 className 应用到 popover', async () => {
        const steps = makeSteps();
        steps[0].className = 'step-cls';
        render(<UserGuide className="guide-cls" steps={steps} visible />);
        await screen.findByText('Title A');
        expect($(`.${prefix}-popover`)).toHaveClass('guide-cls', 'step-cls');
    });

    it('getPopupContainer 与 zIndex 只作用于遮罩，不传给 top layer 中的 popover', async () => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        render(<UserGuide getPopupContainer={() => container} steps={makeSteps()} visible zIndex={2000} />);
        await screen.findByText('Title A');
        expect(popoverProps).not.toHaveProperty('getPopupContainer');
        expect(popoverProps).not.toHaveProperty('zIndex');
        expect(container.contains(screen.getByText('Title A'))).toBe(false);
        expect($(`.${prefix}-spotlight`).style.zIndex).toBe('2000');
        container.remove();
    });

    it('modal 模式接收 className、style、步骤 mask、getPopupContainer 与 zIndex', async () => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const steps = makeSteps();
        steps[0].className = 'step-cls';
        steps[0].mask = false;
        render(<UserGuide className="guide-cls" style={{ color: 'red' }} getPopupContainer={() => container} mode="modal" steps={steps} visible zIndex={2000} />);
        await screen.findByText('Title A');
        const modal = $(`.${prefix}-modal`);
        expect(modal).toHaveClass('guide-cls', 'step-cls');
        expect(modal.querySelector(`.${BASE_CLASS_PREFIX}-modal`)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(container.contains(modal)).toBe(true);
        expect(modal.closest<HTMLElement>(`.${BASE_CLASS_PREFIX}-portal`).style.zIndex).toBe('2000');
        expect($(`.${BASE_CLASS_PREFIX}-modal-mask`)).toBeNull();
        container.remove();
    });
});

describe('UserGuide 函数组件', () => {
    it('窗口缩放及任意容器内滚动时重新计算聚光区域', async () => {
        const steps = makeSteps();
        render(<UserGuide steps={steps} visible />);
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
        const { rerender, unmount } = render(<UserGuide steps={steps} visible />);
        await waitFor(() => expect(spotRect()).not.toBeNull());
        rerender(<UserGuide steps={steps} visible={false} />);
        measure.mockClear();
        fireEvent(window, new Event('resize'));
        expect(measure).not.toHaveBeenCalled();

        rerender(<UserGuide steps={steps} visible />);
        await waitFor(() => expect(spotRect()).not.toBeNull());
        unmount();
        measure.mockClear();
        fireEvent(window, new Event('resize'));
        fireEvent.scroll(document);
        expect(measure).not.toHaveBeenCalled();
    });

    it('spotlightPadding={0} 表示无内边距，而非默认值', async () => {
        const steps = makeSteps();
        render(<UserGuide spotlightPadding={0} steps={steps} visible />);
        await waitFor(() => expect(rectOf(spotRect())).toEqual([10, 20, 100, 30]));
    });

    it('关闭时恢复 body 的结束内边距', () => {
        const steps = makeSteps();
        document.body.style.paddingInlineEnd = '4px';
        const { rerender } = render(<UserGuide steps={steps} />);
        rerender(<UserGuide steps={steps} visible />);
        expect(document.body.style.paddingInlineEnd).not.toBe('4px');
        rerender(<UserGuide steps={steps} visible={false} />);
        expect(document.body.style.paddingInlineEnd).toBe('4px');
        document.body.style.paddingInlineEnd = '';
    });

    it('挂载时已可见则锁定 body 滚动', () => {
        const { unmount } = render(<UserGuide steps={makeSteps()} visible />);
        expect(document.body.style.overflow).toBe('hidden');
        unmount();
        expect(document.body.style.overflow).toBe('');
    });

    it('无步骤时切换 visible 不报错', async () => {
        const { rerender } = render(<UserGuide steps={[]} />);
        rerender(<UserGuide steps={[]} visible />);
        await new Promise((resolve) => requestAnimationFrame(resolve));
        expect($(`.${prefix}-spotlight`)).toBeNull();
    });

    it('受控 current 超出 steps 范围时不渲染且不抛错', () => {
        const steps = makeSteps();
        render(<UserGuide current={5} steps={steps} visible />);
        render(<UserGuide current={5} mode="modal" steps={steps} visible />);
        expect($(`.${prefix}-popover`)).toBeNull();
        expect($(`.${prefix}-modal`)).toBeNull();
    });

    it('读取 semiGlobal.config.overrideDefaultProps', async () => {
        semiGlobal.config.overrideDefaultProps = { UserGuide: { showSkipButton: false, finishText: 'All done' } };
        try {
            render(<UserGuide current={2} steps={makeSteps()} visible />);
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
        render(<UserGuide mode="modal" steps={makeSteps()} visible onFinish={onFinish} onNext={onNext} />);
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

    it('指示器跟随受控 current', async () => {
        const steps = makeSteps().map((step) => ({ ...step, cover: <img alt={`cover-${step.title}`} /> }));
        const { rerender } = render(<UserGuide current={0} mode="modal" steps={steps} visible />);
        await screen.findByText('Title A');
        expect(activeDot()).toBe(0);
        rerender(<UserGuide current={2} mode="modal" steps={steps} visible />);
        await screen.findByText('Title C');
        expect(activeDot()).toBe(2);
        expect(screen.getByRole('button', { name: '完成' })).toBeInTheDocument();
    });

    it('skip、自定义文案与语言包', async () => {
        const onSkip = vi.fn<NonNullable<UserGuideProps['onSkip']>>();
        const steps = makeSteps();
        const { rerender } = render(
            <LocaleProvider locale={en_US}>
                <UserGuide current={1} mode="modal" steps={steps} visible onSkip={onSkip} />
            </LocaleProvider>
        );
        await screen.findByText('Title B');
        fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
        expect(onSkip).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button', { name: 'Prev' })).toBeInTheDocument();
        rerender(
            <LocaleProvider locale={en_US}>
                <UserGuide current={2} finishText="Done" mode="modal" steps={steps} visible />
            </LocaleProvider>
        );
        expect(await screen.findByRole('button', { name: 'Done' })).toBeInTheDocument();
    });

    it('步骤标题为对话框命名，且不产生缺少名称的警告', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            const { rerender } = render(<UserGuide current={0} mode="modal" steps={makeSteps()} visible />);
            expect(await screen.findByRole('dialog', { name: 'Title A' })).toBeInTheDocument();
            rerender(<UserGuide current={1} mode="modal" steps={makeSteps()} visible />);
            expect(await screen.findByRole('dialog', { name: 'Title B' })).toBeInTheDocument();
            expect(warn.mock.calls.filter(([message]) => message.includes('accessible name'))).toHaveLength(0);
        } finally {
            warn.mockRestore();
        }
    });

    it('按 Escape 跳过引导，最后一步同样生效', async () => {
        const onSkip = vi.fn<NonNullable<UserGuideProps['onSkip']>>();
        const onFinish = vi.fn<NonNullable<UserGuideProps['onFinish']>>();
        const steps = makeSteps();
        const { unmount } = render(<UserGuide current={0} mode="modal" steps={steps} visible onFinish={onFinish} onSkip={onSkip} />);
        await screen.findByRole('dialog');
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onSkip).toHaveBeenCalledTimes(1);
        // a new Modal: the cancel of one Modal is debounced
        unmount();
        render(<UserGuide current={2} mode="modal" steps={steps} visible onFinish={onFinish} onSkip={onSkip} />);
        await screen.findByText('Title C');
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onSkip).toHaveBeenCalledTimes(2);
        expect(onFinish).not.toHaveBeenCalled();
    });
});

describe('UserGuide 弹出模式 Escape', () => {
    it('按 Escape 跳过引导，最后一步同样生效', async () => {
        const onSkip = vi.fn<NonNullable<UserGuideProps['onSkip']>>();
        const onFinish = vi.fn<NonNullable<UserGuideProps['onFinish']>>();
        render(<UserGuide current={2} steps={makeSteps()} visible onFinish={onFinish} onSkip={onSkip} />);
        await screen.findByText('Title C');
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onSkip).toHaveBeenCalledTimes(1);
        expect(onFinish).not.toHaveBeenCalled();
    });
});

describe('UserGuide 弹出模式名称', () => {
    it('步骤标题为弹出对话框命名', async () => {
        render(<UserGuide steps={makeSteps()} visible />);
        expect(await screen.findByRole('dialog', { name: 'Title A' })).toBeInTheDocument();
    });
});

describe('UserGuide 按钮属性', () => {
    it('使用方的 onClick 先于内置处理执行，不替换内置处理', async () => {
        const onClick = vi.fn<NonNullable<ButtonProps['onClick']>>();
        const onNext = vi.fn<NonNullable<UserGuideProps['onNext']>>();
        const onFinish = vi.fn<NonNullable<UserGuideProps['onFinish']>>();
        const steps = makeSteps();
        const { rerender } = render(<UserGuide nextButtonProps={{ onClick }} steps={steps} visible onFinish={onFinish} onNext={onNext} />);
        await screen.findByText('Title A');
        fireEvent.click(screen.getByRole('button', { name: '下一步' }));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onNext).toHaveBeenCalledWith(1);
        await screen.findByText('Title B');

        rerender(<UserGuide current={2} nextButtonProps={{ onClick }} steps={steps} visible onFinish={onFinish} />);
        await screen.findByText('Title C');
        fireEvent.click(screen.getByRole('button', { name: '完成' }));
        expect(onFinish).toHaveBeenCalledTimes(1);
    });

    it('使用方的 style 与内置 style 合并，同名字段以使用方为准', async () => {
        render(<UserGuide nextButtonProps={{ style: { color: 'red' } }} steps={makeSteps().map((step) => ({ ...step, theme: 'primary' as const }))} visible />);
        const next = await screen.findByRole('button', { name: '下一步' });
        expect(next.style.color).toBe('red');
        expect(next.style.backgroundColor).toBe('var(--semi-color-white)');
    });

    it('弹窗模式的按钮同样先调用使用方的 onClick', async () => {
        const onClick = vi.fn<NonNullable<ButtonProps['onClick']>>();
        const onNext = vi.fn<NonNullable<UserGuideProps['onNext']>>();
        render(<UserGuide mode="modal" nextButtonProps={{ onClick }} steps={makeSteps()} visible onNext={onNext} />);
        fireEvent.click(await screen.findByRole('button', { name: '下一步' }));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onNext).toHaveBeenCalledWith(1);
    });
});

describe('UserGuide 无障碍与滚动锁', () => {
    it('弹出模式的定位锚点不是 Tab 停靠点', async () => {
        render(<UserGuide steps={makeSteps()} visible />);
        await screen.findByText('Title A');
        const anchor = $('div[style*="pointer-events: none"]');
        expect(anchor).not.toBeNull();
        expect(anchor).toHaveAttribute('tabindex', '-1');
    });

    it('没有遮罩时不锁定 body 滚动', async () => {
        const { rerender } = render(<UserGuide mask={false} steps={makeSteps()} visible />);
        await screen.findByText('Title A');
        expect(document.body.style.overflow).toBe('');
        rerender(<UserGuide mask={false} mode="modal" steps={makeSteps()} visible />);
        await screen.findByText('Title A');
        expect(document.body.style.overflow).toBe('');
    });

    it('步骤切换到无遮罩的步骤时释放滚动锁', async () => {
        const steps = makeSteps();
        steps[1].mask = false;
        const { rerender } = render(<UserGuide current={0} steps={steps} visible />);
        await screen.findByText('Title A');
        expect(document.body.style.overflow).toBe('hidden');
        rerender(<UserGuide current={1} steps={steps} visible />);
        await screen.findByText('Title B');
        expect(document.body.style.overflow).toBe('');
    });

    it('弹窗模式打开时聚焦主按钮', async () => {
        const { rerender } = render(<UserGuide current={0} mode="modal" steps={makeSteps()} visible />);
        const next = await screen.findByRole('button', { name: '下一步' });
        await waitFor(() => expect(next).toHaveFocus());
        rerender(<UserGuide current={2} mode="modal" steps={makeSteps()} visible />);
        const finish = await screen.findByRole('button', { name: '完成' });
        await waitFor(() => expect(finish).toHaveFocus());
    });

    it('弹窗模式向读屏暴露「当前/总数」，圆点本身对读屏隐藏', async () => {
        const steps = makeSteps().map((step) => ({ ...step, cover: <img alt="cover" /> }));
        const { rerender } = render(<UserGuide current={0} mode="modal" steps={steps} visible />);
        await screen.findByText('Title A');
        expect(screen.getByText('1/3')).toHaveClass(`${prefix}-modal-progress`);
        expect($(`.${prefix}-modal-indicator`)).toHaveAttribute('aria-hidden', 'true');
        rerender(<UserGuide current={1} mode="modal" steps={steps} visible />);
        await screen.findByText('Title B');
        expect(screen.getByText('2/3')).toBeInTheDocument();
    });
});
