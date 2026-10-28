/** @jsxImportSource vue */
import { fireEvent } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import Badge from '../index';
import type { BadgeProps } from '../interface';
import CustomCount from './fixtures/custom-count.vue';
import Rtl from './fixtures/rtl.vue';

const child = () => <span>Semi</span>;
const getRoot = (container: Element) => container.querySelector<HTMLElement>('.semi-badge');
const getCount = (container: Element) => container.querySelector<HTMLElement>('[x-semi-prop="count"]');

describe('Badge', () => {
    it('class 落在根元素，countStyle 落在计数节点', () => {
        const view = render(Badge, {
            attrs: { class: 'test' },
            props: { count: 5, countStyle: { color: 'red' } },
            slots: { default: child },
        });
        expect(getRoot(view.container)).toHaveClass('test');
        expect(view.container.querySelector('.test .semi-badge-count')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('默认插槽渲染在根元素内', () => {
        const view = render(Badge, { slots: { default: () => <div>semi design</div> } });
        expect(getRoot(view.container)).toContainElement(view.getByText('semi design'));
    });

    it('count 为数字或字符串', async () => {
        const view = render(Badge, { props: { count: 5 }, slots: { default: child } });
        expect(view.container.querySelector('.semi-badge-count')).toHaveTextContent(/^5$/);
        expect(view.container.querySelector('.semi-badge-dot')).toBeNull();

        await view.rerender({ count: 'semi' });
        expect(view.container.querySelector('.semi-badge-count')).toHaveTextContent(/^semi$/);
        expect(view.container.querySelector('.semi-badge-dot')).toBeNull();
    });

    it('dot 显示圆点而不是计数', () => {
        const view = render(Badge, { props: { dot: true }, slots: { default: child } });
        expect(view.container.querySelector('.semi-badge-dot')).not.toBeNull();
        expect(view.container.querySelector('.semi-badge-count')).toBeNull();
    });

    it('overflowCount 截断超出的数字', () => {
        const view = render(Badge, { props: { count: 99, overflowCount: 5 }, slots: { default: child } });
        expect(view.container.querySelector('.semi-badge-count')).toHaveTextContent(/^5\+$/);
    });

    it('type 与 theme 各自产生类名', async () => {
        const types = ['primary', 'secondary', 'tertiary', 'warning', 'danger'] as const;
        const themes = ['solid', 'light', 'inverted'] as const;
        const view = render(Badge, { props: { type: types[0], theme: themes[0] }, slots: { default: child } });
        expect(view.container.querySelector(`.semi-badge-${types[0]}`)).not.toBeNull();
        for (const type of types.slice(1)) {
            await view.rerender({ type, theme: themes[0] });
            expect(view.container.querySelector(`.semi-badge-${type}`)).not.toBeNull();
        }
        for (const theme of themes.slice(1)) {
            await view.rerender({ type: 'danger', theme });
            expect(view.container.querySelector(`.semi-badge-${theme}`)).not.toBeNull();
        }
    });

    it('position 决定位置类名，默认 rightTop', () => {
        const cases: [BadgeProps, string][] = [
            [{ position: 'leftTop' }, '.semi-badge-leftTop'],
            [{ position: 'leftBottom' }, '.semi-badge-leftBottom'],
            [{}, '.semi-badge-rightTop'],
            [{ position: 'rightBottom' }, '.semi-badge-rightBottom'],
        ];
        for (const [props, selector] of cases) {
            const view = render(Badge, { props, slots: { default: child } });
            expect(view.container.querySelector(selector)).not.toBeNull();
            view.unmount();
        }
    });

    it('RTL 下默认位置为 leftTop，方向切换后跟随', async () => {
        const view = render(Rtl, { props: { direction: 'rtl' } });
        expect(view.container.querySelector('.semi-badge-leftTop')).not.toBeNull();
        await view.rerender({ direction: 'ltr' });
        expect(view.container.querySelector('.semi-badge-leftTop')).toBeNull();
        expect(view.container.querySelector('.semi-badge-rightTop')).not.toBeNull();
    });

    it('计数节点的 class、x-semi-prop 以及默认 type 与 theme', () => {
        const view = render(Badge, { props: { count: 5, countClassName: 'cc' }, slots: { default: child } });
        const count = getCount(view.container);
        expect(count).toHaveClass('cc', 'semi-badge-primary', 'semi-badge-solid', 'semi-badge-count');
        expect(count).not.toHaveClass('semi-badge-block');
        expect(getRoot(view.container)?.lastElementChild).toBe(count);
    });

    it('style 落在根元素，计数节点只吃 countStyle', () => {
        const view = render(Badge, {
            attrs: { style: 'color: red' },
            props: { count: 5, countStyle: { color: 'blue' } },
            slots: { default: child },
        });
        expect(getRoot(view.container)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(getCount(view.container)).toHaveStyle({ color: 'rgb(0, 0, 255)' });
    });

    it('没有默认插槽时为块级元素，不带位置类名', () => {
        const view = render(Badge, { props: { count: 5, position: 'leftTop' } });
        const count = getCount(view.container);
        expect(count).toHaveClass('semi-badge-block');
        expect(count).not.toHaveClass('semi-badge-leftTop');
    });

    it('count 插槽去掉 type、theme 与 count 类名，并加 custom', () => {
        const view = render(CustomCount);
        const count = getCount(view.container);
        expect(count).toHaveClass('semi-badge-custom');
        expect(count).not.toHaveClass('semi-badge-danger');
        expect(count).not.toHaveClass('semi-badge-light');
        expect(count).not.toHaveClass('semi-badge-count');
        expect(count).toContainElement(view.getByTestId('icon'));
    });

    it('count 插槽优先于 count 属性', () => {
        const view = render(CustomCount, { props: { count: 8 } });
        expect(getCount(view.container)).toContainElement(view.getByTestId('icon'));
        expect(getCount(view.container)).not.toHaveTextContent('8');
    });

    it('count 为 0 时显示，null 与 undefined 不显示', async () => {
        const view = render(Badge, { props: { count: 0 }, slots: { default: child } });
        expect(getCount(view.container)).toHaveClass('semi-badge-count');
        expect(getCount(view.container)).toHaveTextContent(/^0$/);

        await view.rerender({ count: null });
        expect(getCount(view.container)).not.toHaveClass('semi-badge-count');
        expect(getCount(view.container)?.textContent).toBe('');

        await view.rerender({ count: undefined });
        expect(getCount(view.container)).not.toHaveClass('semi-badge-count');
        expect(getCount(view.container)?.textContent).toBe('');
    });

    it('overflowCount 仅在数字超过时生效，0 视为未设置', async () => {
        const view = render(Badge, { props: { count: 5, overflowCount: 5 }, slots: { default: child } });
        expect(view.container.querySelector('.semi-badge-count')).toHaveTextContent(/^5$/);
        await view.rerender({ count: 6, overflowCount: 0 });
        expect(view.container.querySelector('.semi-badge-count')).toHaveTextContent(/^6$/);
    });

    it('字符串 count 不参与 overflowCount 截断', () => {
        const view = render(Badge, { props: { count: '99', overflowCount: 10 }, slots: { default: child } });
        expect(view.container.querySelector('.semi-badge-count')).toHaveTextContent(/^99$/);
    });

    it('dot 模式隐藏计数文字', () => {
        const view = render(Badge, { props: { dot: true, count: 5 }, slots: { default: child } });
        const dot = view.container.querySelector('.semi-badge-dot');
        expect(dot).toBeEmptyDOMElement();
        expect(dot).not.toHaveClass('semi-badge-count');
    });

    it('其他属性与原生事件落到根元素', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const onMouseenter = vi.fn<(event: MouseEvent) => void>();
        const onMouseleave = vi.fn<(event: MouseEvent) => void>();
        const view = render(Badge, {
            attrs: { 'data-testid': 'badge', id: 'b', onClick, onMouseenter, onMouseleave },
            props: { count: 5 },
        });
        const root = getRoot(view.container) as HTMLElement;
        expect(root).toBe(view.getByTestId('badge'));
        expect(root).toHaveAttribute('id', 'b');
        await fireEvent.click(root);
        await fireEvent.mouseEnter(root);
        await fireEvent.mouseLeave(root);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0]?.[0].type).toBe('click');
        expect(onMouseenter).toHaveBeenCalledTimes(1);
        expect(onMouseleave).toHaveBeenCalledTimes(1);
    });

    it('组件 ref 的 $el 是根元素', () => {
        let instance: { $el: Element } | undefined;
        const view = render(() => <Badge count={5} ref={(value) => (instance = value as typeof instance)} />);
        expect(instance?.$el).toBe(getRoot(view.container));
    });

    it('读取 app 的全局默认值，显式属性优先', async () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Badge: { type: 'danger', dot: true } };
        const global = { provide: { [semiGlobalKey]: semi } };
        const view = render(Badge, { global, props: { count: 5 }, slots: { default: child } });
        expect(getCount(view.container)).toHaveClass('semi-badge-danger', 'semi-badge-dot');
        expect(getCount(view.container)).toBeEmptyDOMElement();

        await view.rerender({ count: 5, type: 'primary', dot: false });
        expect(getCount(view.container)).toHaveClass('semi-badge-primary', 'semi-badge-count');
        expect(getCount(view.container)).toHaveTextContent(/^5$/);
    });

    it('非函数全局默认值按实例缓存，修改全局配置不影响已有实例', async () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Badge: { type: 'danger' } };
        const global = { provide: { [semiGlobalKey]: semi } };
        const view = render(Badge, { global, props: { count: 5 }, slots: { default: child } });
        semi.config.overrideDefaultProps = { Badge: { type: 'warning' } };
        await view.rerender({ count: 6 });
        expect(getCount(view.container)).toHaveClass('semi-badge-danger');
        expect(getCount(view.container)).not.toHaveClass('semi-badge-warning');
    });

    it('默认插槽只求值一次', () => {
        const slot = vi.fn<typeof child>(child);
        render(Badge, { props: { count: 5 }, slots: { default: slot } });
        expect(slot).toHaveBeenCalledTimes(1);
    });

    it('随单向绑定更新 count 与 dot', async () => {
        const view = render(Badge, { props: { count: 1 }, slots: { default: child } });
        await view.rerender({ count: 2 });
        expect(view.container.querySelector('.semi-badge-count')).toHaveTextContent(/^2$/);
        await view.rerender({ count: 2, dot: true });
        expect(view.container.querySelector('.semi-badge-count')).toBeNull();
        expect(view.container.querySelector('.semi-badge-dot')).not.toBeNull();
    });
});
