import { createSignal } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';
import { semiGlobal } from '@fibrae/semi-ui-solid/utils';
import { Col, Row } from '..';

const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;

function gutterVars(row: HTMLElement, axis: 'x' | 'y') {
    return Object.fromEntries(breakpoints.map((bp) => [bp, row.style.getPropertyValue(`--semi-row-gutter-${axis}-${bp}`)]));
}

function colVars(col: HTMLElement) {
    return Object.fromEntries(
        Array.from(col.style)
            .filter((name) => name.startsWith('--semi-col-'))
            .map((name) => [name, col.style.getPropertyValue(name)])
    );
}

describe('Row', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('渲染基础 row 类名与 children 插槽，并把未知属性透传到根元素', () => {
        const { container } = render(() => (
            <Row id="r" data-testid="row" class="custom" style={{ color: 'red' }}>
                <span>child</span>
            </Row>
        ));
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

    it('justify 与 align 在基础类名之外追加对应类名', () => {
        const { container } = render(() => <Row align="middle" justify="space-between" />);
        expect((container.firstChild as HTMLElement).className).toBe('semi-row semi-row-justify-space-between semi-row-align-middle');
    });

    it('不传 justify 与 align 时只有基础类名', () => {
        const { container } = render(() => <Row />);
        expect((container.firstChild as HTMLElement).className).toBe('semi-row');
    });

    it('不传 gutter 时，横纵向在每个断点都写入 0px（供 grid.scss 的媒体查询读取）', () => {
        const { container } = render(() => <Row />);
        const row = container.firstChild as HTMLElement;
        expect(gutterVars(row, 'x')).toEqual({ xs: '0px', sm: '0px', md: '0px', lg: '0px', xl: '0px', xxl: '0px' });
        expect(gutterVars(row, 'y')).toEqual({ xs: '0px', sm: '0px', md: '0px', lg: '0px', xl: '0px', xxl: '0px' });
    });

    it('数字 gutter 对每个断点都写入同一个值', () => {
        const { container } = render(() => <Row gutter={16} />);
        expect(gutterVars(container.firstChild as HTMLElement, 'x')).toEqual({ xs: '16px', sm: '16px', md: '16px', lg: '16px', xl: '16px', xxl: '16px' });
    });

    it('gutter 为 0 或负数时，横纵向变量都解析为 0px，Col 没有自己的内联样式', () => {
        const { container } = render(() => (
            <Row gutter={[0, -8]}>
                <Col />
            </Row>
        ));
        const row = container.querySelector('.semi-row') as HTMLElement;
        expect(gutterVars(row, 'x')).toEqual({ xs: '0px', sm: '0px', md: '0px', lg: '0px', xl: '0px', xxl: '0px' });
        expect(gutterVars(row, 'y')).toEqual({ xs: '0px', sm: '0px', md: '0px', lg: '0px', xl: '0px', xxl: '0px' });
        expect(container.querySelector('.semi-col')?.getAttribute('style')).toBeNull();
    });

    it('响应式 gutter 对象按断点写入对应的 CSS 变量：sm 及以上延用更小断点已定义的值，xs 是独立区间', () => {
        const { container } = render(() => (
            <Row gutter={{ xs: 4, md: 16, xl: 24 }}>
                <Col />
            </Row>
        ));
        expect(gutterVars(container.querySelector('.semi-row') as HTMLElement, 'x')).toEqual({
            xs: '4px',
            sm: '0px', // nothing smaller than md to inherit
            md: '16px',
            lg: '16px',
            xl: '24px',
            xxl: '24px',
        });
    });

    it('响应式 gutter 也作用于纵向，写入 --semi-row-gutter-y-*', () => {
        const { container } = render(() => (
            <Row gutter={[8, { xs: 4, sm: 20 }]}>
                <Col />
            </Row>
        ));
        const row = container.querySelector('.semi-row') as HTMLElement;
        expect(gutterVars(row, 'y')).toMatchObject({ xs: '4px', sm: '20px', md: '20px' });
        expect(gutterVars(row, 'x')).toMatchObject({ xs: '8px', sm: '8px' });
    });

    it('不调用 window.matchMedia 解析响应式 gutter，gutter 变化也不注册监听', () => {
        const matchMediaSpy = vi.spyOn(window, 'matchMedia');
        const [gutter, setGutter] = createSignal<Parameters<typeof Row>[0]['gutter']>({ xs: 4, md: 16 });
        const { unmount } = render(() => (
            <Row gutter={gutter()}>
                <Col />
            </Row>
        ));
        setGutter(8);
        unmount();
        expect(matchMediaSpy).not.toHaveBeenCalled();
        matchMediaSpy.mockRestore();
    });

    it('字符串 style 追加在 gutter 变量之后', () => {
        // Solid accepts a string style; the lint rule only allows the object form in JSX literals
        const ownStyle = { style: 'color: red; --semi-row-gutter-x-xs: 3px' };
        const { container } = render(() => <Row gutter={8} {...ownStyle} />);
        const row = container.firstChild as HTMLElement;
        expect(row.style.color).toBe('red');
        expect(row.style.getPropertyValue('--semi-row-gutter-x-xs')).toBe('3px');
        expect(row.style.getPropertyValue('--semi-row-gutter-x-sm')).toBe('8px');
    });

    it('读取 semiGlobal overrideDefaultProps，显式属性优先', () => {
        semiGlobal.config.overrideDefaultProps = { Row: { justify: 'center' }, Col: { span: 6 } };
        const { container } = render(() => (
            <Row>
                <Col />
                <Col span={12} />
            </Row>
        ));
        expect(container.firstChild).toHaveClass(`${BASE_CLASS_PREFIX}-row-justify-center`);
        const [first, second] = Array.from(container.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-col`));
        expect(colVars(first)).toEqual({ '--semi-col-span': '6' });
        expect(colVars(second)).toEqual({ '--semi-col-span': '12' });
    });

    it('ref 回调拿到根 div', () => {
        let rowEl: HTMLDivElement | undefined;
        let colEl: HTMLDivElement | undefined;
        const { container } = render(() => (
            <Row ref={(node) => (rowEl = node)}>
                <Col ref={(node) => (colEl = node)} />
            </Row>
        ));
        expect(rowEl).toBe(container.querySelector('.semi-row'));
        expect(colEl).toBe(container.querySelector('.semi-col'));
    });

    it('挂载后 gutter 变为响应式时，CSS 变量立即反映新的断点配置', () => {
        const [gutter, setGutter] = createSignal<Parameters<typeof Row>[0]['gutter']>(8);
        const { container } = render(() => (
            <Row gutter={gutter()}>
                <Col />
            </Row>
        ));
        setGutter({ sm: 8, xxl: 40 });
        expect(gutterVars(container.querySelector('.semi-row') as HTMLElement, 'x')).toMatchObject({ sm: '8px', md: '8px', lg: '8px', xl: '8px', xxl: '40px' });
    });
});

describe('Col', () => {
    it('span、order、offset、push 与 pull 写成内联 CSS 变量，类名只有基础类名与 class', () => {
        const { container } = render(() => (
            <Row>
                <Col class="custom" offset={3} order={2} pull={5} push={4} span={6} />
            </Row>
        ));
        const col = container.querySelector('.semi-col') as HTMLElement;
        expect(col.className).toBe('semi-col custom');
        expect(colVars(col)).toEqual({ '--semi-col-span': '6', '--semi-col-offset': '3', '--semi-col-push': '4', '--semi-col-pull': '5', '--semi-col-order': '2' });
    });

    it('值为 0 也写入变量；span 为 0 时另写 display 变量隐藏', () => {
        const { container } = render(() => (
            <Row>
                <Col offset={0} order={0} pull={0} push={0} span={0} />
            </Row>
        ));
        expect(colVars(container.querySelector('.semi-col') as HTMLElement)).toEqual({ '--semi-col-span': '0', '--semi-col-offset': '0', '--semi-col-push': '0', '--semi-col-pull': '0', '--semi-col-order': '0', '--semi-col-display': 'none' });
    });

    it('没有属性时不写任何变量', () => {
        const { container } = render(() => <Col />);
        expect(colVars(container.firstChild as HTMLElement)).toEqual({});
    });

    it('响应式尺寸接受数字或对象，变量名带断点后缀，未写的键不输出', () => {
        const { container } = render(() => (
            <Row>
                <Col md={{ span: 12, order: 0, offset: 2, push: 1, pull: 0 }} xs={24} xxl={{ order: 3 }} />
            </Row>
        ));
        const col = container.querySelector('.semi-col') as HTMLElement;
        expect(colVars(col)).toEqual({
            '--semi-col-span-xs': '24',
            '--semi-col-span-md': '12',
            '--semi-col-order-md': '0',
            '--semi-col-offset-md': '2',
            '--semi-col-push-md': '1',
            '--semi-col-pull-md': '0',
            '--semi-col-order-xxl': '3',
        });
        for (const size of ['xs', 'md', 'xxl']) {
            expect(col).not.toHaveAttribute(size);
        }
    });

    it('任一层的 span 为 0 时，写了 span 的每一层都带 display 变量，后面的非 0 span 重新显示', () => {
        const { container } = render(() => <Col md={0} sm={8} xs={{ span: 12, order: 1 }} />);
        expect(colVars(container.firstChild as HTMLElement)).toEqual({
            '--semi-col-span-xs': '12',
            '--semi-col-order-xs': '1',
            '--semi-col-display-xs': 'block',
            '--semi-col-span-sm': '8',
            '--semi-col-display-sm': 'block',
            '--semi-col-span-md': '0',
            '--semi-col-display-md': 'none',
        });
    });

    it('变量随 prop 变化', () => {
        const [span, setSpan] = createSignal(6);
        const { container } = render(() => <Col span={span()} />);
        setSpan(8);
        expect(colVars(container.firstChild as HTMLElement)).toEqual({ '--semi-col-span': '8' });
    });

    it('用户 style 与生成的变量合并，同名时用户的值优先，字符串与对象都可以', () => {
        const [style, setStyle] = createSignal<string | Record<string, string>>({ '--semi-col-span': '12', color: 'red' });
        // Solid accepts a string style; the lint rule only allows the object form in JSX literals
        const { container } = render(() => <Col span={6} {...{ style: style() }} />);
        const col = container.firstChild as HTMLElement;
        expect(col.style.getPropertyValue('--semi-col-span')).toBe('12');
        expect(col.style.color).toBe('red');
        setStyle('--semi-col-span: 18; color: blue');
        expect(col.style.getPropertyValue('--semi-col-span')).toBe('18');
        expect(col.style.color).toBe('blue');
    });

    it('未知属性透传到根元素，style 原样转发（padding 完全由继承的 CSS 变量驱动，不在 JS 里计算）', () => {
        const { container } = render(() => (
            <Row gutter={16}>
                <Col id="c" data-testid="col" style={{ 'padding-left': '1px' }}>
                    <span>child</span>
                </Col>
            </Row>
        ));
        const col = container.querySelector('.semi-col') as HTMLElement;
        expect(col).toHaveAttribute('data-testid', 'col');
        expect(col).toHaveAttribute('id', 'c');
        expect(col).toHaveAttribute('x-semi-prop', 'children');
        expect(col.getAttribute('style')).toBe('padding-left: 1px;');
        expect(col).toHaveTextContent('child');
    });

    it('在 Row 之外渲染，没有 Row 写入的 gutter 变量，样式里只有 Col 自己的变量', () => {
        const { container } = render(() => <Col span={12}>child</Col>);
        const col = container.querySelector(`.${BASE_CLASS_PREFIX}-col`) as HTMLElement;
        expect(colVars(col)).toEqual({ '--semi-col-span': '12' });
        expect(col).toHaveTextContent('child');
    });
});
