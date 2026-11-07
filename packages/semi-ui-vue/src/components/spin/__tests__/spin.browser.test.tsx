/** @jsxImportSource vue */
import { type Component, defineComponent } from 'vue';
import { screen } from '@testing-library/vue';
import { describe, expect, it, onTestFinished } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Spin from '..';
import List, { ListItem } from '../../list';
import Table from '../../table';

function keyframesNames(rules: CSSRuleList): string[] {
    return Array.from(rules).flatMap((rule) => {
        if (rule instanceof CSSKeyframesRule) {
            return [rule.name];
        }
        return rule instanceof CSSGroupingRule ? keyframesNames(rule.cssRules) : [];
    });
}

describe('Spin（浏览器）', () => {
    it('多个 Spin 共用一份旋转 keyframes', () => {
        const first = render(Spin);
        const second = render(Spin);
        const name = `${BASE_CLASS_PREFIX}-animation-rotate`;
        const firstIcon = first.container.querySelector('svg') as SVGSVGElement;
        const secondIcon = second.container.querySelector('svg') as SVGSVGElement;
        expect(getComputedStyle(firstIcon).animationName).toBe(name);
        expect(getComputedStyle(secondIcon).animationName).toBe(name);
        const defined = Array.from(document.styleSheets).flatMap((sheet) => keyframesNames(sheet.cssRules));
        expect(defined.filter((item) => item === name)).toHaveLength(1);
    });
});

describe('Spin 加载期间的焦点（浏览器）', () => {
    const button = (name: string) => <button type="button">{name}</button>;
    const spinOf = (container: ParentNode) => container.querySelector(`.${BASE_CLASS_PREFIX}-spin`) as HTMLElement;
    const inside = () => screen.getByRole('button', { name: 'inside' });
    const rowButton = () => screen.getByRole('button', { name: 'row' });

    const plain = defineComponent({
        props: { loading: Boolean },
        setup: (props) => () => (
            <>
                <Spin spinning={props.loading}>{() => button('inside')}</Spin>
                {button('after')}
            </>
        ),
    });
    const withList = defineComponent({
        props: { loading: Boolean },
        setup: (props) => () => <List loading={props.loading}>{() => <ListItem>{{ extra: () => button('row') }}</ListItem>}</List>,
    });
    const withTable = defineComponent({
        props: { loading: Boolean },
        setup: (props) => () => (
            <Table columns={[{ title: 'name', dataIndex: 'name' }]} dataSource={[{ key: '1', name: 'a' }]} loading={props.loading} pagination={false}>
                {{ cell: () => [button('row')] }}
            </Table>
        ),
    });

    it('加载期间 Tab 不进入被包裹内容，结束后恢复', async () => {
        const view = render(plain, { props: { loading: true } });
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
        await view.rerender({ loading: false });
        await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
        expect(inside()).toHaveFocus();
    });

    it('焦点在被包裹内容里时，开始加载后移到 Spin 根元素，结束后回到原控件', async () => {
        const view = render(plain, { props: { loading: false } });
        inside().focus();
        await view.rerender({ loading: true });
        expect(spinOf(view.container)).toHaveFocus();
        await view.rerender({ loading: false });
        expect(inside()).toHaveFocus();
    });

    it('键盘焦点交接到 Spin 根元素后显示主题焦点环', async () => {
        const view = render(plain, { props: { loading: false } });
        await tabTo(inside());
        await view.rerender({ loading: true });
        expect(spinOf(view.container)).toHaveFocus();
        expectThemeFocusRing(spinOf(view.container));
    });

    it('加载期间焦点已被用户移走时，结束后不抢焦点', async () => {
        const view = render(plain, { props: { loading: false } });
        inside().focus();
        await view.rerender({ loading: true });
        screen.getByRole('button', { name: 'after' }).focus();
        await view.rerender({ loading: false });
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
        expect(spinOf(view.container)).not.toHaveFocus();
    });

    it('ShadowRoot 内加载时焦点由根元素接住，结束后回到原控件', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        onTestFinished(() => host.remove());
        const shadow = host.attachShadow({ mode: 'open' });
        const container = document.createElement('div');
        shadow.append(container);
        const view = render(plain, { props: { loading: false }, container });
        const innerButton = shadow.querySelector('button') as HTMLButtonElement;
        innerButton.focus();
        await view.rerender({ loading: true });
        expect(shadow.activeElement).toBe(spinOf(container));
        await view.rerender({ loading: false });
        expect(shadow.activeElement).toBe(innerButton);
    });

    it.each([
        ['List', withList],
        ['Table', withTable],
    ] as [string, Component][])('%s 加载时，行内按钮的焦点移到 Spin 根元素，结束后回到该按钮', async (_, component) => {
        const view = render(component, { props: { loading: false } });
        rowButton().focus();
        await view.rerender({ loading: true });
        expect(spinOf(view.container)).toHaveFocus();
        await view.rerender({ loading: false });
        expect(rowButton()).toHaveFocus();
    });
});
