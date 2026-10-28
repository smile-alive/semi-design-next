import { createSignal, onMount } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import Divider from '..';
import semiGlobal from '../../_utils/semi-global';

describe('Divider', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('Divider 自定义 class 与 style', () => {
        const { container } = render(() => <Divider class="test" style={{ color: 'red' }} />);
        const divider = container.querySelector('.semi-divider');
        expect(divider).toHaveClass('test');
        expect(divider).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('title 标题', () => {
        const { container } = render(() => <Divider>divider title</Divider>);
        expect(container.firstChild).toHaveTextContent(/^divider title$/);
    });

    it('align 对齐', () => {
        const { container } = render(() => (
            <div>
                Semi-Design
                <Divider>divider center title</Divider>
                Semi-Design
                <Divider align="left">divider left title</Divider>
                Semi-Design
                <Divider align="right">divider right title</Divider>
            </div>
        ));
        const [center, left, right] = container.querySelectorAll('.semi-divider');
        expect(center).toHaveClass('semi-divider-with-text-center');
        expect(left).toHaveClass('semi-divider-with-text-left');
        expect(right).toHaveClass('semi-divider-with-text-right');
    });

    it('layout 布局', () => {
        const { container } = render(() => (
            <div>
                Semi-Design
                <Divider layout="vertical" />
                Semi-Design
                <Divider layout="vertical" />
                Semi-Design
                <Divider layout="vertical" />
            </div>
        ));
        expect(container.querySelectorAll('.semi-divider-vertical')).toHaveLength(3);
    });

    it('多段文本与数字 children 与单个字符串一样被包进 inner-text', () => {
        const { container } = render(() => (
            <div>
                <Divider>共 {3} 项</Divider>
                <Divider>{5}</Divider>
            </div>
        ));
        const [multi, number] = container.querySelectorAll('.semi-divider');
        expect(multi.querySelector('.semi-divider_inner-text')).toHaveTextContent('共 3 项');
        expect(number.querySelector('.semi-divider_inner-text')).toHaveTextContent('5');
    });

    it('children 为数字 0 时按内容处理：有 with-text 类，且包进 inner-text', () => {
        const { container } = render(() => <Divider>{0}</Divider>);
        const divider = container.firstElementChild as Element;
        expect(divider).toHaveClass('semi-divider-with-text', 'semi-divider-with-text-center');
        expect(divider.querySelector('.semi-divider_inner-text')).toHaveTextContent('0');
    });

    it('元素 children 原样输出，不包 inner-text', () => {
        const { container } = render(() => (
            <Divider>
                <em>x</em>
            </Divider>
        ));
        expect(container.querySelector('.semi-divider_inner-text')).toBeNull();
        expect(container.querySelector('.semi-divider em')).not.toBeNull();
    });

    it('无内容的分割线是 separator，竖直时带 aria-orientation', () => {
        const { container } = render(() => (
            <div>
                <Divider />
                <Divider layout="vertical" />
                <Divider layout="vertical">ignored</Divider>
            </div>
        ));
        const [horizontal, vertical, verticalWithChildren] = container.querySelectorAll('.semi-divider');
        expect(horizontal).toHaveAttribute('role', 'separator');
        expect(horizontal).not.toHaveAttribute('aria-orientation');
        expect(vertical).toHaveAttribute('role', 'separator');
        expect(vertical).toHaveAttribute('aria-orientation', 'vertical');
        expect(verticalWithChildren).toHaveAttribute('aria-orientation', 'vertical');
        expect(verticalWithChildren).toHaveTextContent('');
    });

    it('竖直分割线不创建 children', () => {
        const mounted = vi.fn<() => void>();
        const Child = () => {
            onMount(mounted);
            return <em>x</em>;
        };
        const [layout, setLayout] = createSignal<'horizontal' | 'vertical'>('vertical');
        const { container } = render(() => (
            <Divider layout={layout()}>
                <Child />
            </Divider>
        ));
        expect(mounted).not.toHaveBeenCalled();
        setLayout('horizontal');
        expect(mounted).toHaveBeenCalledTimes(1);
        expect(container.querySelector('.semi-divider em')).not.toBeNull();
    });

    it('带文字的分割线不加 role，避免文字被当作装饰；显式 role 优先', () => {
        const { container } = render(() => (
            <div>
                <Divider>text</Divider>
                <Divider role="presentation" />
            </div>
        ));
        const [text, own] = container.querySelectorAll('.semi-divider');
        expect(text).not.toHaveAttribute('role');
        expect(own).toHaveAttribute('role', 'presentation');
    });

    it('children 只有 null、false、空字符串时按无内容处理', () => {
        const { container } = render(() => (
            <Divider>
                {null}
                {false}
                {''}
            </Divider>
        ));
        const divider = container.firstElementChild as Element;
        expect(divider).toHaveAttribute('role', 'separator');
        expect(divider).not.toHaveClass('semi-divider-with-text');
    });

    it('dashed 虚线', () => {
        const { container } = render(() => (
            <div>
                Semi-Design
                <Divider dashed />
                Semi-Design
                <Divider dashed />
                Semi-Design
                <Divider dashed />
            </div>
        ));
        expect(container.querySelectorAll('.semi-divider-dashed')).toHaveLength(3);
    });

    it('margin 按方向写上下或左右外边距，数字补 px，style 优先', () => {
        // Solid accepts a string style; the lint rule only allows the object form in JSX literals
        const ownStyle = { style: 'margin-bottom: 3px' };
        const { container } = render(() => (
            <div>
                <Divider margin={12} />
                <Divider layout="vertical" margin="1em" />
                <Divider margin={12} style={{ 'margin-top': '2px' }} />
                <Divider margin={12} {...ownStyle} />
            </div>
        ));
        const [horizontal, vertical, overridden, overriddenString] = Array.from(container.querySelectorAll<HTMLElement>('.semi-divider'));
        expect(horizontal).toHaveStyle({ marginTop: '12px', marginBottom: '12px' });
        expect([vertical.style.marginLeft, vertical.style.marginRight]).toEqual(['1em', '1em']);
        expect(overridden).toHaveStyle({ marginTop: '2px', marginBottom: '12px' });
        expect(overriddenString).toHaveStyle({ marginTop: '12px', marginBottom: '3px' });
    });

    it('children 变化时在文字、元素和无内容之间切换', () => {
        const [content, setContent] = createSignal<string | undefined>('text');
        const { container } = render(() => <Divider>{content()}</Divider>);
        const divider = container.firstElementChild as Element;
        expect(divider).toHaveClass('semi-divider-with-text');
        setContent(undefined);
        expect(divider).not.toHaveClass('semi-divider-with-text');
        expect(divider).toHaveAttribute('role', 'separator');
        setContent('again');
        expect(divider.querySelector('.semi-divider_inner-text')).toHaveTextContent('again');
    });

    it('读取 semiGlobal overrideDefaultProps，显式属性优先', () => {
        semiGlobal.config.overrideDefaultProps = { Divider: { layout: 'vertical', align: 'left' } } as typeof semiGlobal.config.overrideDefaultProps;
        const { container } = render(() => (
            <div>
                <Divider />
                <Divider layout="horizontal">t</Divider>
            </div>
        ));
        const [vertical, horizontal] = container.querySelectorAll('.semi-divider');
        expect(vertical).toHaveClass('semi-divider-vertical');
        expect(horizontal).toHaveClass('semi-divider-horizontal', 'semi-divider-with-text-left');
    });
});
