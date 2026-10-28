/** @jsxImportSource vue */
import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import { Col, Row, type RowProps } from '../index';
import InstanceRefs from './fixtures/instance-refs.vue';

const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;

function gutterVars(row: HTMLElement, axis: 'x' | 'y') {
    return Object.fromEntries(breakpoints.map((bp) => [bp, row.style.getPropertyValue(`--semi-row-gutter-${axis}-${bp}`)]));
}

const zeros = { xs: '0px', sm: '0px', md: '0px', lg: '0px', xl: '0px', xxl: '0px' };

const renderRow = (props: RowProps = {}) => render(Row, { props, slots: { default: () => <Col /> } });
const getRow = (container: Element) => container.querySelector('.semi-row') as HTMLElement;

describe('Row', () => {
    it('渲染基础 row 类名与默认插槽，并把未声明属性透传到根元素', () => {
        const view = render(Row, {
            attrs: { id: 'r', 'data-testid': 'row', class: 'custom', style: 'color: red' },
            slots: { default: () => <span>child</span> },
        });
        const row = view.container.firstChild as HTMLElement;
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
        const view = render(Row, { props: { type: 'flex', align: 'middle', justify: 'space-between' } });
        expect((view.container.firstChild as HTMLElement).className).toBe('semi-row-flex semi-row-flex-space-between semi-row-flex-middle');
    });

    it('未设置 type 时忽略 justify 与 align', () => {
        const view = render(Row, { props: { align: 'top', justify: 'center' } });
        expect((view.container.firstChild as HTMLElement).className).toBe('semi-row');
    });

    it('不传 gutter 时，横纵向在每个断点都写入 0px', () => {
        const row = getRow(renderRow().container);
        expect(gutterVars(row, 'x')).toEqual(zeros);
        expect(gutterVars(row, 'y')).toEqual(zeros);
    });

    it('数字 gutter 对每个断点都写入同一个值', () => {
        const row = getRow(renderRow({ gutter: 16 }).container);
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
        const view = renderRow({ gutter: [0, -8] });
        const row = getRow(view.container);
        expect(gutterVars(row, 'x')).toEqual(zeros);
        expect(gutterVars(row, 'y')).toEqual(zeros);
        expect(view.container.querySelector('.semi-col')?.getAttribute('style')).toBeNull();
    });

    it('响应式 gutter 对象按断点写入对应的 CSS 变量：sm 及以上延用更小断点的值，xs 是独立区间', () => {
        const row = getRow(renderRow({ gutter: { xs: 4, md: 16, xl: 24 } }).container);
        expect(gutterVars(row, 'x')).toEqual({
            xs: '4px',
            sm: '0px',
            md: '16px',
            lg: '16px',
            xl: '24px',
            xxl: '24px',
        });
    });

    it('响应式 gutter 也作用于纵向', () => {
        const row = getRow(renderRow({ gutter: [8, { xs: 4, sm: 20 }] }).container);
        expect(gutterVars(row, 'y')).toMatchObject({ xs: '4px', sm: '20px', md: '20px' });
        expect(gutterVars(row, 'x')).toMatchObject({ xs: '8px', sm: '8px' });
    });

    it('不调用 window.matchMedia 解析响应式 gutter', async () => {
        const matchMediaSpy = vi.spyOn(window, 'matchMedia');
        const view = renderRow({ gutter: { xs: 4, md: 16 } });
        expect(matchMediaSpy).not.toHaveBeenCalled();
        await view.rerender({ gutter: 8 });
        expect(matchMediaSpy).not.toHaveBeenCalled();
        view.unmount();
        expect(matchMediaSpy).not.toHaveBeenCalled();
        matchMediaSpy.mockRestore();
    });

    it('挂载后 gutter 变为响应式时，CSS 变量立即反映新的断点配置', async () => {
        const view = render(Row, { props: { gutter: 8 } });
        await view.rerender({ gutter: { sm: 8, xxl: 40 } });
        expect(gutterVars(getRow(view.container), 'x')).toMatchObject({
            sm: '8px',
            md: '8px',
            lg: '8px',
            xl: '8px',
            xxl: '40px',
        });
    });

    it('用户 style 中同名的变量覆盖 Row 写入的变量', () => {
        const view = render(Row, { attrs: { style: '--semi-row-gutter-x-md: 3px' }, props: { gutter: 16 } });
        const row = getRow(view.container);
        expect(row.style.getPropertyValue('--semi-row-gutter-x-md')).toBe('3px');
        expect(row.style.getPropertyValue('--semi-row-gutter-x-lg')).toBe('16px');
    });

    it('嵌套 Row 完整写出自己的变量，不依赖外层', () => {
        const view = render(() => <Row gutter={20}>{() => <Col>{() => <Row gutter={8} class="inner" />}</Col>}</Row>);
        const inner = view.container.querySelector('.inner') as HTMLElement;
        expect(gutterVars(inner, 'x')).toMatchObject({ xs: '8px', xxl: '8px' });
        expect(gutterVars(inner, 'y')).toEqual(zeros);
    });

    it('读取 app 的全局默认值，显式属性优先；undefined 回落到全局值', async () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Row: { gutter: 16, prefixCls: 'g' } };
        const global = { provide: { [semiGlobalKey]: semi } };
        const view = render(Row, { global });
        expect(view.container.firstChild).toHaveClass('g-row');
        expect(gutterVars(view.container.firstChild as HTMLElement, 'x').md).toBe('16px');
        const zero = render(Row, { global, props: { gutter: 0 } });
        expect(gutterVars(zero.container.firstChild as HTMLElement, 'x').md).toBe('0px');
        const unset = render(Row, { global, props: { gutter: undefined } });
        expect(gutterVars(unset.container.firstChild as HTMLElement, 'x').md).toBe('16px');
    });

    it('prefixCls 局部覆盖对 Row 与 Col 分别生效', () => {
        const view = render(() => (
            <Row prefixCls="a">
                {() => (
                    <>
                        <Col prefixCls="b" />
                        <Col />
                    </>
                )}
            </Row>
        ));
        expect(view.container.querySelector('.a-row')).not.toBeNull();
        expect(view.container.querySelector('.b-col')).not.toBeNull();
        expect(view.container.querySelector('.semi-col')).not.toBeNull();
    });
});

describe('Col', () => {
    it('渲染 span、order、offset、push 与 pull 类名', () => {
        const view = render(() => <Row>{() => <Col class="custom" offset={3} order={2} pull={5} push={4} span={6} />}</Row>);
        expect(view.container.querySelector('.semi-col')?.className).toBe('semi-col semi-col-6 semi-col-order-2 semi-col-offset-3 semi-col-push-4 semi-col-pull-5 custom');
    });

    it('跳过为 0 的 order、offset、push 与 pull，但保留 span 0', () => {
        const view = render(Col, { props: { offset: 0, order: 0, pull: 0, push: 0, span: 0 } });
        expect(view.container.querySelector('.semi-col')?.className).toBe('semi-col semi-col-0');
    });

    it('从数字与对象渲染响应式尺寸类名，并保留 0 值', () => {
        const view = render(Col, {
            props: { md: { span: 12, order: 0, offset: 2, push: 1, pull: 0 }, xs: 24, xxl: { order: 3 } },
        });
        const col = view.container.querySelector('.semi-col') as HTMLElement;
        expect(col.className).toBe('semi-col semi-col-xs-24 semi-col-md-12 semi-col-md-order-0 semi-col-md-offset-2 semi-col-md-push-1 semi-col-md-pull-0 semi-col-xxl-order-3');
        for (const size of ['xs', 'md', 'xxl']) {
            expect(col).not.toHaveAttribute(size);
        }
    });

    it('未声明属性透传到根元素，style 原样转发', () => {
        const view = render(() => (
            <Row gutter={16}>
                {() => (
                    <Col id="c" data-testid="col" style={{ paddingLeft: '1px' }}>
                        {() => <span>child</span>}
                    </Col>
                )}
            </Row>
        ));
        const col = view.container.querySelector('.semi-col') as HTMLElement;
        expect(col).toHaveAttribute('data-testid', 'col');
        expect(col).toHaveAttribute('id', 'c');
        expect(col).toHaveAttribute('x-semi-prop', 'children');
        expect(col.getAttribute('style')).toBe('padding-left: 1px;');
        expect(col).toHaveTextContent('child');
    });

    it('在 Row 之外渲染，不设置任何内联样式', () => {
        const view = render(Col, { props: { span: 12 }, slots: { default: () => 'child' } });
        const col = view.container.querySelector('.semi-col') as HTMLElement;
        expect(col).toHaveClass('semi-col-12');
        expect(col.getAttribute('style')).toBeNull();
        expect(col).toHaveTextContent('child');
    });

    it('span 等 prop 变化后类名响应式更新', async () => {
        const view = render(Col, { props: { span: 6 } });
        await view.rerender({ span: 8, xs: { offset: 1 } });
        expect(view.container.querySelector('.semi-col')?.className).toBe('semi-col semi-col-8 semi-col-xs-offset-1');
    });

    it('读取 app 的全局默认值，显式属性优先', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Col: { prefixCls: 'g', span: 4 } };
        const view = render(
            () => (
                <Row>
                    {() => (
                        <>
                            <Col />
                            <Col prefixCls="own" />
                        </>
                    )}
                </Row>
            ),
            {
                global: { provide: { [semiGlobalKey]: semi } },
            }
        );
        expect(view.container.querySelector('.g-col')).toHaveClass('g-col-4');
        expect(view.container.querySelector('.own-col')).not.toBeNull();
    });

    it('组件实例的 $el 指向根 div', () => {
        const view = render(InstanceRefs);
        expect(view.emitted().els[0]).toEqual([view.container.querySelector('.semi-row'), view.container.querySelector('.semi-col')]);
    });
});
