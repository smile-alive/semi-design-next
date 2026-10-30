import { render, screen } from '@testing-library/react';
import { describe, expect, it, onTestFinished } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { List, Table } from '@fibrae/semi-ui-react';
import IconButton from '@fibrae/semi-ui-react/icon-button';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import Spin from '..';

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
        const { container } = render(
            <>
                <Spin />
                <IconButton loading />
            </>
        );
        const name = `${BASE_CLASS_PREFIX}-animation-rotate`;
        expect(getComputedStyle(container.querySelector(`.${BASE_CLASS_PREFIX}-spin-wrapper > svg`)).animationName).toBe(name);
        expect(getComputedStyle(container.querySelector(`.${BASE_CLASS_PREFIX}-button-content > svg`)).animationName).toBe(name);
        const defined = Array.from(document.styleSheets).flatMap((sheet) => keyframesNames(sheet.cssRules));
        expect(defined.filter((item) => item === name)).toHaveLength(1);
    });
});

describe('Spin 加载期间的焦点（浏览器）', () => {
    const getSpin = (container: HTMLElement) => container.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-spin`);

    const view = (spinning: boolean) => {
        return (
            <>
                <Spin spinning={spinning}>
                    <button type="button">inside</button>
                </Spin>
                <button type="button">after</button>
            </>
        );
    };

    it('加载期间 Tab 不进入被包裹内容，结束后恢复', async () => {
        const { rerender } = render(view(true));
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
        rerender(view(false));
        await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
        expect(screen.getByRole('button', { name: 'inside' })).toHaveFocus();
    });

    it('焦点在被包裹内容里时，开始加载后移到 Spin 根元素，结束后回到原控件', () => {
        const { container, rerender } = render(view(false));
        screen.getByRole('button', { name: 'inside' }).focus();
        rerender(view(true));
        expect(getSpin(container)).toHaveFocus();
        rerender(view(false));
        expect(screen.getByRole('button', { name: 'inside' })).toHaveFocus();
    });

    it('键盘焦点交接到 Spin 根元素后显示主题焦点环', async () => {
        const { container, rerender } = render(view(false));
        await tabTo(screen.getByRole('button', { name: 'inside' }));
        rerender(view(true));
        expect(getSpin(container)).toHaveFocus();
        expectThemeFocusRing(getSpin(container));
    });

    it('加载期间焦点已被用户移走时，结束后不抢焦点', () => {
        const { container, rerender } = render(view(false));
        screen.getByRole('button', { name: 'inside' }).focus();
        rerender(view(true));
        screen.getByRole('button', { name: 'after' }).focus();
        rerender(view(false));
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
        const { rerender } = render(view(false), { container });
        const inside = shadow.querySelector('button') as HTMLButtonElement;
        inside.focus();
        rerender(view(true));
        expect(shadow.activeElement).toBe(getSpin(container));
        rerender(view(false));
        expect(shadow.activeElement).toBe(inside);
    });

    it('List 加载时，行内按钮的焦点移到 Spin 根元素，结束后回到该按钮', () => {
        const items = (loading: boolean) => (
            <List loading={loading}>
                <List.Item extra={<button type="button">row</button>} />
            </List>
        );
        const { container, rerender } = render(items(false));
        screen.getByRole('button', { name: 'row' }).focus();
        rerender(items(true));
        expect(getSpin(container)).toHaveFocus();
        rerender(items(false));
        expect(screen.getByRole('button', { name: 'row' })).toHaveFocus();
    });

    it('Table 加载时，行内按钮的焦点移到 Spin 根元素，结束后回到该按钮', () => {
        const columns = [{ title: 'name', dataIndex: 'name', render: () => <button type="button">row</button> }];
        const table = (loading: boolean) => <Table columns={columns} dataSource={[{ key: '1', name: 'a' }]} loading={loading} pagination={false} />;
        const { container, rerender } = render(table(false));
        screen.getByRole('button', { name: 'row' }).focus();
        rerender(table(true));
        expect(getSpin(container)).toHaveFocus();
        rerender(table(false));
        expect(screen.getByRole('button', { name: 'row' })).toHaveFocus();
    });
});
