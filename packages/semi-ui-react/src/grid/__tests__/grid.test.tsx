import { StrictMode, createRef } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import { Row, Col } from '../index';

const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;

function gutterVars(row: HTMLElement, axis: 'x' | 'y') {
    return Object.fromEntries(breakpoints.map((bp) => [bp, row.style.getPropertyValue(`--semi-row-gutter-${axis}-${bp}`)]));
}

describe('Row', () => {
    it('渲染基础 row 类名与 children 插槽，并把未知属性透传到根元素', () => {
        // RowProps does not declare the attributes forwarded to the root
        const rootAttrs = { id: 'r', 'data-testid': 'row' };
        const { container } = render(
            <Row {...rootAttrs} className="custom" style={{ color: 'red' }}>
                <span>child</span>
            </Row>
        );
        const row = container.firstChild as HTMLElement;
        expect(row.tagName).toBe('DIV');
        expect(row).toHaveClass('semi-row', 'custom');
        expect(row).toHaveAttribute('x-semi-prop', 'children');
        expect(row).toHaveAttribute('data-testid', 'row');
        expect(row).toHaveAttribute('id', 'r');
        expect(row).not.toHaveAttribute('gutter');
        expect(row.style.color).toBe('red');
        expect(row).toHaveTextContent('child');
    });

    it('type 为 flex 时使用 flex 类名，替代基础类名', () => {
        const { container } = render(<Row type="flex" align="middle" justify="space-between" />);
        const row = container.firstChild as HTMLElement;
        expect(row.className).toBe('semi-row-flex semi-row-flex-space-between semi-row-flex-middle');
    });

    it('未设置 type 时忽略 justify 与 align', () => {
        const { container } = render(<Row align="top" justify="center" />);
        expect((container.firstChild as HTMLElement).className).toBe('semi-row');
    });

    it('不传 gutter 时，横纵向在每个断点都写入 0px（供 grid.scss 的媒体查询读取）', () => {
        const { container } = render(<Row />);
        const row = container.firstChild as HTMLElement;
        expect(gutterVars(row, 'x')).toEqual({ xs: '0px', sm: '0px', md: '0px', lg: '0px', xl: '0px', xxl: '0px' });
        expect(gutterVars(row, 'y')).toEqual({ xs: '0px', sm: '0px', md: '0px', lg: '0px', xl: '0px', xxl: '0px' });
    });

    it('数字 gutter 对每个断点都写入同一个值', () => {
        const { container } = render(<Row gutter={16} />);
        const row = container.firstChild as HTMLElement;
        expect(gutterVars(row, 'x')).toEqual({
            xs: '16px',
            sm: '16px',
            md: '16px',
            lg: '16px',
            xl: '16px',
            xxl: '16px',
        });
    });

    it('gutter 为 0 或负数时，横纵向变量都解析为 0px，Col 没有自己的内联样式', () => {
        const { container } = render(
            <Row gutter={[0, -8]}>
                <Col />
            </Row>
        );
        const row = container.querySelector('.semi-row') as HTMLElement;
        expect(gutterVars(row, 'x')).toEqual({ xs: '0px', sm: '0px', md: '0px', lg: '0px', xl: '0px', xxl: '0px' });
        expect(gutterVars(row, 'y')).toEqual({ xs: '0px', sm: '0px', md: '0px', lg: '0px', xl: '0px', xxl: '0px' });
        // padding now comes entirely from `.semi-col`'s CSS; Col itself sets no inline style
        expect(container.querySelector('.semi-col')?.getAttribute('style')).toBeNull();
    });

    it('响应式 gutter 对象按断点写入对应的 CSS 变量：sm 及以上延用更小断点已定义的值，xs 是独立区间', () => {
        const { container } = render(
            <Row gutter={{ xs: 4, md: 16, xl: 24 }}>
                <Col />
            </Row>
        );
        const row = container.querySelector('.semi-row') as HTMLElement;
        expect(gutterVars(row, 'x')).toEqual({
            xs: '4px',
            sm: '0px', // nothing smaller than md to inherit
            md: '16px',
            lg: '16px',
            xl: '24px',
            xxl: '24px',
        });
    });

    it('响应式 gutter 也作用于纵向，写入 --semi-row-gutter-y-*', () => {
        const { container } = render(
            <Row gutter={[8, { xs: 4, sm: 20 }]}>
                <Col />
            </Row>
        );
        const row = container.querySelector('.semi-row') as HTMLElement;
        expect(gutterVars(row, 'y')).toMatchObject({ xs: '4px', sm: '20px', md: '20px' });
        expect(gutterVars(row, 'x')).toMatchObject({ xs: '8px', sm: '8px' });
    });

    // Regression: the removed implementation registered six `window.matchMedia` listeners (one per breakpoint)
    // whenever `gutter` contained a responsive object, and kept them alive for the component's whole lifetime.
    it('不再调用 window.matchMedia 解析响应式 gutter', () => {
        const matchMediaSpy = vi.spyOn(window, 'matchMedia');
        const { rerender, unmount } = render(
            <Row gutter={{ xs: 4, md: 16 }}>
                <Col />
            </Row>
        );
        expect(matchMediaSpy).not.toHaveBeenCalled();
        rerender(
            <Row gutter={8}>
                <Col />
            </Row>
        );
        expect(matchMediaSpy).not.toHaveBeenCalled();
        unmount();
        expect(matchMediaSpy).not.toHaveBeenCalled();
    });

    it('StrictMode 下挂载、重渲染与卸载都不注册任何媒体查询监听', () => {
        const matchMediaSpy = vi.spyOn(window, 'matchMedia');
        const { rerender, unmount } = render(
            <StrictMode>
                <Row gutter={{ md: 16 }}>
                    <Col />
                </Row>
            </StrictMode>
        );
        expect(matchMediaSpy).not.toHaveBeenCalled();
        rerender(
            <StrictMode>
                <Row gutter={{ md: 16, xl: 32 }}>
                    <Col />
                </Row>
            </StrictMode>
        );
        expect(matchMediaSpy).not.toHaveBeenCalled();
        unmount();
        expect(matchMediaSpy).not.toHaveBeenCalled();
    });
});

describe('Col', () => {
    it('渲染 span、order、offset、push 与 pull 类名', () => {
        const { container } = render(
            <Row>
                <Col className="custom" offset={3} order={2} pull={5} push={4} span={6} />
            </Row>
        );
        expect(container.querySelector('.semi-col').className).toBe('semi-col semi-col-6 semi-col-order-2 semi-col-offset-3 semi-col-push-4 semi-col-pull-5 custom');
    });

    it('跳过为 0 的 order、offset、push 与 pull，但保留 span 0', () => {
        const { container } = render(
            <Row>
                <Col offset={0} order={0} pull={0} push={0} span={0} />
            </Row>
        );
        expect(container.querySelector('.semi-col').className).toBe('semi-col semi-col-0');
    });

    it('从数字与对象渲染响应式尺寸类名，并保留 0 值', () => {
        const { container } = render(
            <Row>
                <Col md={{ span: 12, order: 0, offset: 2, push: 1, pull: 0 }} xs={24} xxl={{ order: 3 }} />
            </Row>
        );
        const col = container.querySelector('.semi-col');
        expect(col.className).toBe('semi-col semi-col-xs-24 semi-col-md-12 semi-col-md-order-0 semi-col-md-offset-2 semi-col-md-push-1 semi-col-md-pull-0 semi-col-xxl-order-3');
        for (const size of ['xs', 'md', 'xxl']) {
            expect(col).not.toHaveAttribute(size);
        }
    });

    it('未知属性透传到根元素，style 原样转发（padding 完全由继承的 CSS 变量驱动，不在 JS 里计算）', () => {
        // ColProps does not declare the attributes forwarded to the root
        const rootAttrs = { id: 'c', 'data-testid': 'col' };
        const { container } = render(
            <Row gutter={16}>
                <Col {...rootAttrs} style={{ paddingLeft: 1 }}>
                    <span>child</span>
                </Col>
            </Row>
        );
        const col = container.querySelector('.semi-col') as HTMLElement;
        expect(col).toHaveAttribute('data-testid', 'col');
        expect(col).toHaveAttribute('id', 'c');
        expect(col).toHaveAttribute('x-semi-prop', 'children');
        expect(col.getAttribute('style')).toBe('padding-left: 1px;');
        expect(col).toHaveTextContent('child');
    });

    it('在 Row 之外渲染，没有 Row 写入的 gutter 变量，Col 不设置任何内联样式，与 ant-design 一致', () => {
        const { container } = render(<Col span={12}>child</Col>);
        const col = container.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-col`);
        expect(col).toHaveClass(`${BASE_CLASS_PREFIX}-col-12`);
        expect(col.getAttribute('style')).toBeNull();
        expect(col).toHaveTextContent('child');
    });
});

describe('Row 与 Col 作为函数组件', () => {
    it('读取 semiGlobal overrideDefaultProps，显式属性优先', () => {
        const before = semiGlobal.config.overrideDefaultProps;
        semiGlobal.config.overrideDefaultProps = { Row: { prefixCls: 'g' }, Col: { prefixCls: 'g' } };
        try {
            const { container } = render(
                <Row>
                    <Col />
                    <Col prefixCls="own" />
                </Row>
            );
            expect(container.firstChild).toHaveClass('g-row');
            expect(container.querySelector('.g-col')).not.toBeNull();
            expect(container.querySelector('.own-col')).not.toBeNull();
        } finally {
            semiGlobal.config.overrideDefaultProps = before;
        }
    });

    it('ref 转发到根 div', () => {
        const rowRef = createRef<HTMLDivElement>();
        const colRef = createRef<HTMLDivElement>();
        const { container } = render(
            <Row ref={rowRef}>
                <Col ref={colRef} />
            </Row>
        );
        expect(rowRef.current).toBe(container.querySelector('.semi-row'));
        expect(colRef.current).toBe(container.querySelector('.semi-col'));
    });

    it('挂载后 gutter 变为响应式时，CSS 变量立即反映新的断点配置', () => {
        const { container, rerender } = render(
            <Row gutter={8}>
                <Col />
            </Row>
        );
        rerender(
            <Row gutter={{ sm: 8, xxl: 40 }}>
                <Col />
            </Row>
        );
        const row = container.querySelector('.semi-row') as HTMLElement;
        expect(gutterVars(row, 'x')).toMatchObject({ sm: '8px', md: '8px', lg: '8px', xl: '8px', xxl: '40px' });
    });
});
