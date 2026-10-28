import { render } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import { Divider } from '@fibrae/semi-ui-react';

describe('Divider', () => {
    it('Divider 自定义 className 与 style', () => {
        const { container } = render(<Divider className="test" style={{ color: 'red' }} />);
        const divider = container.querySelector('.semi-divider');
        expect(divider).toHaveClass('test');
        expect(divider).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('title 标题', () => {
        const { container } = render(<Divider>divider title</Divider>);
        expect(container.firstChild).toHaveTextContent(/^divider title$/);
    });

    it('align 对齐', () => {
        const { container } = render(
            <div>
                Semi-Design
                <Divider>divider center title</Divider>
                Semi-Design
                <Divider align="left">divider left title</Divider>
                Semi-Design
                <Divider align="right">divider right title</Divider>
            </div>
        );
        const [center, left, right] = container.querySelectorAll('.semi-divider');
        expect(center).toHaveClass('semi-divider-with-text-center');
        expect(left).toHaveClass('semi-divider-with-text-left');
        expect(right).toHaveClass('semi-divider-with-text-right');
    });

    it('layout 布局', () => {
        const { container } = render(
            <div>
                Semi-Design
                <Divider layout="vertical" />
                Semi-Design
                <Divider layout="vertical" />
                Semi-Design
                <Divider layout="vertical" />
            </div>
        );
        expect(container.querySelectorAll('.semi-divider-vertical')).toHaveLength(3);
    });
    it('多段文本与数字 children 与单个字符串一样被包进 inner-text', () => {
        const { container } = render(
            <div>
                <Divider>共 {3} 项</Divider>
                <Divider>{5}</Divider>
            </div>
        );
        const [multi, number] = container.querySelectorAll('.semi-divider');
        expect(multi.querySelector('.semi-divider_inner-text')).toHaveTextContent('共 3 项');
        expect(number.querySelector('.semi-divider_inner-text')).toHaveTextContent('5');
    });

    it('children 为数字 0 时按内容处理：有 with-text 类，且包进 inner-text', () => {
        const { container } = render(<Divider>{0}</Divider>);
        const divider = container.firstElementChild;
        expect(divider).toHaveClass('semi-divider-with-text', 'semi-divider-with-text-center');
        expect(divider.querySelector('.semi-divider_inner-text')).toHaveTextContent('0');
    });

    it('元素 children 原样输出，不包 inner-text', () => {
        const { container } = render(
            <Divider>
                <em>x</em>
            </Divider>
        );
        expect(container.querySelector('.semi-divider_inner-text')).toBeNull();
        expect(container.querySelector('.semi-divider em')).not.toBeNull();
    });

    it('无内容的分割线是 separator，竖直时带 aria-orientation', () => {
        const { container } = render(
            <div>
                <Divider />
                <Divider layout="vertical" />
                <Divider layout="vertical">ignored</Divider>
            </div>
        );
        const [horizontal, vertical, verticalWithChildren] = container.querySelectorAll('.semi-divider');
        expect(horizontal).toHaveAttribute('role', 'separator');
        expect(horizontal).not.toHaveAttribute('aria-orientation');
        expect(vertical).toHaveAttribute('role', 'separator');
        expect(vertical).toHaveAttribute('aria-orientation', 'vertical');
        expect(verticalWithChildren).toHaveAttribute('aria-orientation', 'vertical');
    });

    it('带文字的分割线不加 role，避免文字被当作装饰', () => {
        const { container } = render(<Divider>text</Divider>);
        expect(container.firstElementChild).not.toHaveAttribute('role');
    });

    it('dashed 虚线', () => {
        const { container } = render(
            <div>
                Semi-Design
                <Divider dashed />
                Semi-Design
                <Divider dashed />
                Semi-Design
                <Divider dashed />
            </div>
        );
        expect(container.querySelectorAll('.semi-divider-dashed')).toHaveLength(3);
    });
});
