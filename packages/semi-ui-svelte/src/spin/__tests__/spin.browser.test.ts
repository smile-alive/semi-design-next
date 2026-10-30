import { flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, onTestFinished } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import SpinFixture from './spin-fixture.svelte';

function keyframesNames(rules: CSSRuleList): string[] {
    return Array.from(rules).flatMap((rule) => {
        if (rule instanceof CSSKeyframesRule) {
            return [rule.name];
        }
        return rule instanceof CSSGroupingRule ? keyframesNames(rule.cssRules) : [];
    });
}

const spinOf = (container: ParentNode) => container.querySelector(`.${BASE_CLASS_PREFIX}-spin`) as HTMLElement;
const inside = () => screen.getByRole('button', { name: 'inside' });
const after = () => screen.getByRole('button', { name: 'after' });

function setup(spinning: boolean, container?: HTMLElement) {
    const store = createStore({ props: { spinning }, button: true });
    const view = render(SpinFixture, { props: { store }, target: container });
    const set = (value: boolean) => {
        store.props.spinning = value;
        flushSync();
    };
    return { view, set };
}

describe('Svelte Spin（浏览器）', () => {
    it('多个 Spin 共用一份旋转 keyframes', () => {
        const first = render(SpinFixture, { props: { store: createStore({ props: {} }) } });
        const second = render(SpinFixture, { props: { store: createStore({ props: {} }) } });
        const name = `${BASE_CLASS_PREFIX}-animation-rotate`;
        expect(getComputedStyle(first.container.querySelector('svg') as SVGSVGElement).animationName).toBe(name);
        expect(getComputedStyle(second.container.querySelector('svg') as SVGSVGElement).animationName).toBe(name);
        const defined = Array.from(document.styleSheets).flatMap((sheet) => keyframesNames(sheet.cssRules));
        expect(defined.filter((item) => item === name)).toHaveLength(1);
    });
});

describe('Svelte Spin 加载期间的焦点（浏览器）', () => {
    it('加载期间 Tab 不进入被包裹内容，结束后恢复', async () => {
        const { set } = setup(true);
        await userEvent.keyboard('{Tab}');
        expect(after()).toHaveFocus();
        set(false);
        await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
        expect(inside()).toHaveFocus();
    });

    it('焦点在被包裹内容里时，开始加载后移到 Spin 根元素，结束后回到原控件', () => {
        const { view, set } = setup(false);
        inside().focus();
        set(true);
        expect(spinOf(view.container)).toHaveFocus();
        set(false);
        expect(inside()).toHaveFocus();
    });

    it('键盘焦点交接到 Spin 根元素后显示主题焦点环', async () => {
        const { view, set } = setup(false);
        await tabTo(inside());
        set(true);
        expect(spinOf(view.container)).toHaveFocus();
        expectThemeFocusRing(spinOf(view.container));
    });

    it('加载期间焦点已被用户移走时，结束后不抢焦点', () => {
        const { view, set } = setup(false);
        inside().focus();
        set(true);
        after().focus();
        set(false);
        expect(after()).toHaveFocus();
        expect(spinOf(view.container)).not.toHaveFocus();
    });

    it('ShadowRoot 内加载时焦点由根元素接住，结束后回到原控件', () => {
        const host = document.createElement('div');
        document.body.append(host);
        onTestFinished(() => host.remove());
        const shadow = host.attachShadow({ mode: 'open' });
        const container = document.createElement('div');
        shadow.append(container);
        const { set } = setup(false, container);
        const innerButton = shadow.querySelector('button') as HTMLButtonElement;
        innerButton.focus();
        set(true);
        expect(shadow.activeElement).toBe(spinOf(container));
        set(false);
        expect(shadow.activeElement).toBe(innerButton);
    });
});
