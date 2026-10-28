import { createSignal } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it, onTestFinished } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import Spin from '..';
import IconButton from '../../icon-button';

function keyframesNames(rules: CSSRuleList): string[] {
    return Array.from(rules).flatMap((rule) => {
        if (rule instanceof CSSKeyframesRule) {
            return [rule.name];
        }
        return rule instanceof CSSGroupingRule ? keyframesNames(rule.cssRules) : [];
    });
}

describe('Spin（浏览器）', () => {
    it('Spin 与加载中的 IconButton 共用一份旋转 keyframes', () => {
        const { container } = render(() => (
            <>
                <Spin />
                <IconButton loading />
            </>
        ));
        const name = `${BASE_CLASS_PREFIX}-animation-rotate`;
        expect(getComputedStyle(container.querySelector(`.${BASE_CLASS_PREFIX}-spin-wrapper > svg`) as Element).animationName).toBe(name);
        expect(getComputedStyle(container.querySelector(`.${BASE_CLASS_PREFIX}-button-content > svg`) as Element).animationName).toBe(name);
        const defined = Array.from(document.styleSheets).flatMap((sheet) => keyframesNames(sheet.cssRules));
        expect(defined.filter((item) => item === name)).toHaveLength(1);
    });
});

describe('Spin 加载期间的焦点（浏览器）', () => {
    const getSpin = (container: ParentNode) => container.querySelector(`.${BASE_CLASS_PREFIX}-spin`) as HTMLElement;
    const inside = () => screen.getByRole('button', { name: 'inside' });

    function View(props: { spinning: boolean }) {
        return (
            <>
                <Spin spinning={props.spinning}>
                    <button type="button">inside</button>
                </Spin>
                <button type="button">after</button>
            </>
        );
    }

    it('加载期间 Tab 不进入被包裹内容，结束后恢复', async () => {
        const [spinning, setSpinning] = createSignal(true);
        render(() => <View spinning={spinning()} />);
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
        setSpinning(false);
        await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
        expect(inside()).toHaveFocus();
    });

    it('焦点在被包裹内容里时，开始加载后移到 Spin 根元素，结束后回到原控件', () => {
        const [spinning, setSpinning] = createSignal(false);
        const { container } = render(() => <View spinning={spinning()} />);
        inside().focus();
        setSpinning(true);
        expect(getSpin(container)).toHaveFocus();
        setSpinning(false);
        expect(inside()).toHaveFocus();
    });

    it('键盘焦点交接到 Spin 根元素后显示主题焦点环', async () => {
        const [spinning, setSpinning] = createSignal(false);
        const { container } = render(() => <View spinning={spinning()} />);
        await tabTo(inside());
        setSpinning(true);
        expect(getSpin(container)).toHaveFocus();
        expectThemeFocusRing(getSpin(container));
    });

    it('加载期间焦点已被用户移走时，结束后不抢焦点', () => {
        const [spinning, setSpinning] = createSignal(false);
        const { container } = render(() => <View spinning={spinning()} />);
        inside().focus();
        setSpinning(true);
        screen.getByRole('button', { name: 'after' }).focus();
        setSpinning(false);
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
        expect(getSpin(container)).not.toHaveFocus();
    });

    it('ShadowRoot 内加载时焦点由根元素接住，结束后回到原控件', () => {
        const host = document.createElement('div');
        document.body.append(host);
        onTestFinished(() => host.remove());
        const shadow = host.attachShadow({ mode: 'open' });
        const container = document.createElement('div');
        shadow.append(container);
        const [spinning, setSpinning] = createSignal(false);
        render(() => <View spinning={spinning()} />, { container });
        const innerButton = shadow.querySelector('button') as HTMLButtonElement;
        innerButton.focus();
        setSpinning(true);
        expect(shadow.activeElement).toBe(getSpin(container));
        setSpinning(false);
        expect(shadow.activeElement).toBe(innerButton);
    });
});
