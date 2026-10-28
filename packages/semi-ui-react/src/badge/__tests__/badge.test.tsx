import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import Avatar from '@fibrae/semi-ui-react/avatar';
import ConfigProvider from '@fibrae/semi-ui-react/config-provider';
import Badge, { type BadgeProps } from '../index';

function getBadge(props) {
    if (!props.optionList && !props.children) {
        props.children = <Avatar color="blue">Semi</Avatar>;
    }

    return <Badge {...props} />;
}

const getBadgeRoot = (container) => container.querySelector('.semi-badge');

describe('badge', () => {
    it('badge 自定义 className 与 style', () => {
        const { container } = render(
            getBadge({
                className: 'test',
                countStyle: {
                    color: 'red',
                },
                count: 5,
            })
        );
        expect(getBadgeRoot(container)).toHaveClass('test');
        expect(container.querySelector('.test .semi-badge-count')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('badge children', () => {
        const { container } = render(getBadge({ children: <div>semi design</div> }));
        expect(getBadgeRoot(container)).toContainElement(screen.getByText('semi design'));
    });

    it('badge count', () => {
        const { container, rerender } = render(getBadge({ count: 5 }));
        expect(container.querySelector('.semi-badge-count')).toHaveTextContent(/^5$/);
        expect(container.querySelector('.semi-badge-dot')).toBeNull();

        rerender(getBadge({ count: 'semi' }));
        expect(container.querySelector('.semi-badge-count')).toHaveTextContent(/^semi$/);
        expect(container.querySelector('.semi-badge-dot')).toBeNull();
    });

    it('badge dot', () => {
        const { container } = render(getBadge({ dot: true }));
        expect(container.querySelector('.semi-badge-dot')).not.toBeNull();
        expect(container.querySelector('.semi-badge-count')).toBeNull();
    });

    it('badge overflowCount', () => {
        const { container } = render(getBadge({ count: 99, overflowCount: 5 }));
        expect(container.querySelector('.semi-badge-count')).toHaveTextContent(/^5\+$/);
    });

    it('badge type 与 theme', () => {
        const types = ['primary', 'secondary', 'tertiary', 'warning', 'danger'];
        const themes = ['solid', 'light', 'inverted'];
        const { container, rerender } = render(getBadge({ type: types[0], theme: themes[0] }));
        expect(container.querySelector(`.semi-badge-${types[0]}`)).not.toBeNull();
        for (const type of types.slice(1)) {
            rerender(getBadge({ type, theme: themes[0] }));
            expect(container.querySelector(`.semi-badge-${type}`)).not.toBeNull();
        }
        for (const theme of themes.slice(1)) {
            rerender(getBadge({ type: types[4], theme }));
            expect(container.querySelector(`.semi-badge-${theme}`)).not.toBeNull();
        }
    });

    it('badge position', () => {
        const cases: [BadgeProps, string][] = [
            [{ position: 'leftTop' }, '.semi-badge-leftTop'],
            [{ position: 'leftBottom' }, '.semi-badge-leftBottom'],
            [{}, '.semi-badge-rightTop'],
            [{ position: 'rightBottom' }, '.semi-badge-rightBottom'],
        ];
        for (const [props, selector] of cases) {
            const { container, unmount } = render(getBadge(props));
            expect(container.querySelector(selector)).not.toBeNull();
            unmount();
        }
    });

    it('badge RTL 模式', () => {
        const { container } = render(
            <ConfigProvider direction="rtl">
                <Badge count={5}>Semi</Badge>
            </ConfigProvider>
        );
        expect(container.querySelector('.semi-badge-leftTop')).not.toBeNull();
    });

    it('badge count 节点：class、slot 及默认 type 与 theme', () => {
        const { container } = render(getBadge({ count: 5, countClassName: 'cc' }));
        const count = container.querySelector('[x-semi-prop="count"]');
        expect(count).toHaveClass('cc', 'semi-badge-primary', 'semi-badge-solid', 'semi-badge-count');
        expect(count).not.toHaveClass('semi-badge-block');
        expect(getBadgeRoot(container).firstChild).toHaveTextContent('Semi');
        expect(getBadgeRoot(container).lastChild).toBe(count);
    });

    it('badge style 应用到 count 节点，且优先于 countStyle', () => {
        const { container, rerender } = render(getBadge({ count: 5, style: { color: 'red' }, countStyle: { color: 'blue' } }));
        const count = () => container.querySelector('[x-semi-prop="count"]');
        expect(count()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(getBadgeRoot(container)).not.toHaveAttribute('style');

        rerender(getBadge({ count: 5, countStyle: { color: 'blue' } }));
        expect(count()).toHaveStyle({ color: 'rgb(0, 0, 255)' });
    });

    it('无 children 的 badge 为块级元素，不带位置类名', () => {
        const { container } = render(<Badge count={5} position="leftTop" />);
        const count = container.querySelector('[x-semi-prop="count"]');
        expect(count).toHaveClass('semi-badge-block');
        expect(count).not.toHaveClass('semi-badge-leftTop');
    });

    it('自定义节点 count 时去掉 type、theme 与 count 类名', () => {
        const { container } = render(getBadge({ count: <i data-testid="icon" />, type: 'danger', theme: 'light' }));
        const count = container.querySelector('[x-semi-prop="count"]');
        expect(count).toHaveClass('semi-badge-custom');
        expect(count).not.toHaveClass('semi-badge-danger');
        expect(count).not.toHaveClass('semi-badge-light');
        expect(count).not.toHaveClass('semi-badge-count');
        expect(count).toContainElement(screen.getByTestId('icon'));
    });

    it('count 为 0 时显示，null 与 undefined 不显示', () => {
        const { container, rerender } = render(getBadge({ count: 0 }));
        const count = () => container.querySelector('[x-semi-prop="count"]');
        expect(count()).toHaveClass('semi-badge-count');
        expect(count()).toHaveTextContent(/^0$/);

        rerender(getBadge({ count: null }));
        expect(count()).not.toHaveClass('semi-badge-count');
        expect(count()).toBeEmptyDOMElement();

        rerender(getBadge({}));
        expect(count()).not.toHaveClass('semi-badge-count');
        expect(count()).toBeEmptyDOMElement();
    });

    it('仅超过 overflowCount 时才生效', () => {
        const { container, rerender } = render(getBadge({ count: 5, overflowCount: 5 }));
        const count = () => container.querySelector('.semi-badge-count');
        expect(count()).toHaveTextContent(/^5$/);

        rerender(getBadge({ count: 6, overflowCount: 0 }));
        expect(count()).toHaveTextContent(/^6$/);
    });

    it('dot 模式隐藏计数文字', () => {
        const { container } = render(getBadge({ dot: true, count: 5 }));
        const dot = container.querySelector('.semi-badge-dot');
        expect(dot).toBeEmptyDOMElement();
        expect(dot).not.toHaveClass('semi-badge-count');
    });

    it('badge 将其他属性与事件传给根元素', () => {
        const onClick = vi.fn<React.MouseEventHandler>();
        const onMouseEnter = vi.fn<React.MouseEventHandler>();
        const onMouseLeave = vi.fn<React.MouseEventHandler>();
        const { container } = render(getBadge({ count: 5, 'data-testid': 'badge', id: 'b', onClick, onMouseEnter, onMouseLeave }));
        const root = getBadgeRoot(container);
        expect(root).toBe(screen.getByTestId('badge'));
        expect(root).toHaveAttribute('id', 'b');
        fireEvent.click(root);
        fireEvent.mouseEnter(root);
        fireEvent.mouseLeave(root);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].type).toBe('click');
        expect(onMouseEnter).toHaveBeenCalledTimes(1);
        expect(onMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('badge ref 指向根元素', () => {
        const ref = createRef();
        const { container } = render(getBadge({ ref, count: 5 }));
        expect(ref.current).toBe(getBadgeRoot(container));
    });

    it('badge 从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Badge: { type: 'danger', dot: true } };
        try {
            const { container, rerender } = render(getBadge({ count: 5 }));
            const count = () => container.querySelector('[x-semi-prop="count"]');
            expect(count()).toHaveClass('semi-badge-danger', 'semi-badge-dot');
            expect(count()).toBeEmptyDOMElement();
            rerender(getBadge({ count: 5, type: 'primary', dot: false }));
            expect(count()).toHaveClass('semi-badge-primary', 'semi-badge-count');
            expect(count()).toHaveTextContent(/^5$/);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });
});
