import { Profiler } from 'react';
import type React from 'react';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { Col, Row } from '../index';

const marginLeft = (el: Element) => getComputedStyle(el).getPropertyValue('margin-left');
const marginRight = (el: Element) => getComputedStyle(el).getPropertyValue('margin-right');
const marginTop = (el: Element) => getComputedStyle(el).getPropertyValue('margin-top');
const paddingLeft = (el: Element) => getComputedStyle(el).getPropertyValue('padding-left');
const paddingRight = (el: Element) => getComputedStyle(el).getPropertyValue('padding-right');
const paddingTop = (el: Element) => getComputedStyle(el).getPropertyValue('padding-top');

describe('Grid（浏览器）', () => {
    afterEach(async () => {
        await page.viewport(1000, 660);
    });

    describe('断点 0 隐藏', () => {
        const displayAt = async (width: number, props: React.ComponentProps<typeof Col>) => {
            await page.viewport(width, 660);
            const { container } = render(
                <Row>
                    <Col {...props}>col</Col>
                </Row>
            );
            return getComputedStyle(container.querySelector('.semi-col')).display;
        };

        it('md={0} 只在 md 及以上隐藏', async () => {
            expect(await displayAt(500, { md: 0 })).not.toBe('none');
            expect(await displayAt(700, { sm: 12, md: 0 })).not.toBe('none');
            expect(await displayAt(1000, { md: 0 })).toBe('none');
        });

        it('xs 有跨度、md 为 0 时，md 视口隐藏', async () => {
            expect(await displayAt(1000, { xs: 24, md: 0 })).toBe('none');
            expect(await displayAt(500, { xs: 24, md: 0 })).toBe('block');
        });
    });

    describe('Col 的栅格布局', () => {
        // a 480px wide Row makes one column 20px
        const renderRow = (cols: React.ReactNode, rowProps: React.ComponentProps<typeof Row> = {}) => {
            const { container } = render(
                <div style={{ width: 480 }}>
                    <Row {...rowProps}>{cols}</Row>
                </div>
            );
            return Array.from(container.querySelectorAll<HTMLElement>('.semi-col'));
        };

        it('span、offset、push 与 order 按 24 栅格折算', () => {
            const [col] = renderRow(
                <Col offset={3} order={2} push={2} span={6}>
                    col
                </Col>
            );
            const style = getComputedStyle(col);
            expect(style.width).toBe('120px');
            expect(style.marginInlineStart).toBe('60px');
            // inset keeps the fraction layout drops
            expect(parseFloat(style.insetInlineStart)).toBeCloseTo(40, 0);
            expect(style.order).toBe('2');
        });

        it('pull 作用于 inline-end 侧', () => {
            const [col] = renderRow(
                <Col pull={2} span={6}>
                    col
                </Col>
            );
            expect(parseFloat(getComputedStyle(col).insetInlineEnd)).toBeCloseTo(40, 0);
        });

        it('一行放不下时换行', () => {
            const cols = renderRow(
                <>
                    <Col span={16}>a</Col>
                    <Col span={16}>b</Col>
                </>
            );
            expect(cols[1].offsetTop).toBeGreaterThan(cols[0].offsetTop);
        });

        it('没有 span 的 Col 按内容定宽，与 span 的 Col 并排', () => {
            const cols = renderRow(
                <>
                    <Col>auto</Col>
                    <Col span={6}>span</Col>
                </>
            );
            expect(cols[0].offsetWidth).toBeLessThan(120);
            expect(cols[1].offsetTop).toBe(cols[0].offsetTop);
        });

        it('justify 与 align 始终生效', () => {
            const cols = renderRow(<Col span={6}>col</Col>, { align: 'middle', justify: 'center' });
            const row = cols[0].parentElement as HTMLElement;
            expect(getComputedStyle(row).justifyContent).toBe('center');
            expect(getComputedStyle(row).alignItems).toBe('center');
            expect(cols[0].getBoundingClientRect().left - row.getBoundingClientRect().left).toBe(180);
        });

        it('断点从更小的断点继承，没有设置的断点沿用已生效的值', async () => {
            const widthAt = async (viewport: number) => {
                await page.viewport(viewport, 660);
                const [col] = renderRow(<Col md={12} xs={24} />);
                return col.offsetWidth;
            };
            expect(await widthAt(500)).toBe(480);
            // sm sets nothing, so it keeps xs
            expect(await widthAt(700)).toBe(480);
            expect(await widthAt(1000)).toBe(240);
        });
    });

    // the browser project's 1000px viewport is the lg breakpoint, so lg overrides what xs set
    it('在更大断点处设置的 0 值 order、offset、push 和 pull 会重置较小断点的值', () => {
        const { container } = render(
            <Row>
                <Col lg={{ offset: 0, order: 0, pull: 0, push: 0, span: 6 }} xs={{ offset: 4, order: 2, pull: 4, push: 4, span: 6 }}>
                    col
                </Col>
            </Row>
        );
        const style = getComputedStyle(container.querySelector('.semi-col'));
        expect({
            'inset-inline-start': style.getPropertyValue('inset-inline-start'),
            'inset-inline-end': style.getPropertyValue('inset-inline-end'),
            'margin-inline-start': style.getPropertyValue('margin-inline-start'),
            order: style.order,
        }).toEqual({
            'inset-inline-start': '0px',
            'inset-inline-end': '0px',
            'margin-inline-start': '0px',
            order: '0',
        });
    });

    describe('gutter：CSS 变量驱动的 margin/padding', () => {
        it('数字 gutter 只影响横向，纵向为 0', () => {
            const { container } = render(
                <Row gutter={16}>
                    <Col />
                </Row>
            );
            const row = container.querySelector('.semi-row') as HTMLElement;
            const col = container.querySelector('.semi-col') as HTMLElement;
            expect(marginLeft(row)).toBe('-8px');
            expect(marginRight(row)).toBe('-8px');
            expect(marginTop(row)).toBe('0px');
            expect(paddingLeft(col)).toBe('8px');
            expect(paddingRight(col)).toBe('8px');
            expect(paddingTop(col)).toBe('0px');
        });

        it('数组 gutter [横, 纵] 两个方向各自生效', () => {
            const { container } = render(
                <Row gutter={[16, 24]}>
                    <Col />
                </Row>
            );
            const row = container.querySelector('.semi-row') as HTMLElement;
            const col = container.querySelector('.semi-col') as HTMLElement;
            expect(marginLeft(row)).toBe('-8px');
            expect(marginTop(row)).toBe('-12px');
            expect(paddingLeft(col)).toBe('8px');
            expect(paddingTop(col)).toBe('12px');
        });

        it('gutter 为 0 或负数时，实际 margin 与 padding 都是 0', () => {
            const { container } = render(
                <Row gutter={[0, -8]}>
                    <Col />
                </Row>
            );
            const row = container.querySelector('.semi-row') as HTMLElement;
            const col = container.querySelector('.semi-col') as HTMLElement;
            expect(marginLeft(row)).toBe('0px');
            expect(marginTop(row)).toBe('0px');
            expect(paddingLeft(col)).toBe('0px');
            expect(paddingTop(col)).toBe('0px');
        });

        it('Row 是 flex 布局，gutter 落在 margin 与 padding，而非 row-gap', () => {
            const { container } = render(
                <Row gutter={[16, 24]}>
                    <Col />
                </Row>
            );
            const row = container.querySelector('.semi-row') as HTMLElement;
            const col = container.querySelector('.semi-col') as HTMLElement;
            expect(getComputedStyle(row).display).toBe('flex');
            expect(marginLeft(row)).toBe('-8px');
            expect(marginTop(row)).toBe('-12px');
            expect(paddingLeft(col)).toBe('8px');
            expect(paddingTop(col)).toBe('12px');
        });

        it('用户 style 只覆盖显式设置的一侧，另一侧仍由 gutter 的 CSS 决定', async () => {
            const { container } = render(
                <Row style={{ marginLeft: 3 }} gutter={[16, 24]}>
                    <Col />
                </Row>
            );
            const row = container.querySelector('.semi-row') as HTMLElement;
            await expect.poll(() => marginLeft(row)).toBe('3px');
            expect(marginRight(row)).toBe('-8px');
            expect(marginTop(row)).toBe('-12px');
        });

        it('嵌套 Row 完全覆盖外层的 gutter，不会泄漏外层断点的值', () => {
            const { container } = render(
                <Row gutter={20}>
                    <Col>
                        <Row gutter={8}>
                            <Col className="inner" />
                        </Row>
                    </Col>
                </Row>
            );
            const inner = container.querySelector('.inner') as HTMLElement;
            expect(paddingLeft(inner)).toBe('4px');
        });

        it('Col 脱离 Row 时没有任何 gutter 变量可继承，padding 为 0', () => {
            const { container } = render(<Col span={12}>child</Col>);
            const col = container.querySelector('.semi-col') as HTMLElement;
            expect(paddingLeft(col)).toBe('0px');
            expect(paddingTop(col)).toBe('0px');
        });

        describe('响应式 gutter 对象在各断点下的实际值', () => {
            // breakpoints: xs <576, sm >=576, md >=768, lg >=992, xl >=1200, xxl >=1600
            const gutter = { xs: 4, md: 16, xl: 24 };

            it.each([
                [500, '-2px', '2px'],
                [700, '0px', '0px'], // sm does not inherit xs
                [800, '-8px', '8px'],
                [1000, '-8px', '8px'],
                [1300, '-12px', '12px'],
                [1700, '-12px', '12px'],
            ])('视口宽度 %dpx 时，margin 为 %s，padding 为 %s', async (width, expectedMargin, expectedPadding) => {
                await page.viewport(width, 600);
                const { container } = render(
                    <Row gutter={gutter}>
                        <Col />
                    </Row>
                );
                const row = container.querySelector('.semi-row') as HTMLElement;
                const col = container.querySelector('.semi-col') as HTMLElement;
                await expect.poll(() => marginLeft(row)).toBe(expectedMargin);
                expect(paddingLeft(col)).toBe(expectedPadding);
            });
        });
    });

    describe('视口变化不触发重渲染（regression：旧实现用 matchMedia 监听并在断点变化时 setState）', () => {
        it('挂载响应式 gutter 的 Row 只提交一次渲染', () => {
            const onRender = vi.fn<React.ProfilerOnRenderCallback>();
            render(
                <Profiler id="row" onRender={onRender}>
                    <Row gutter={{ xs: 4, md: 16, xl: 24 }}>
                        <Col />
                    </Row>
                </Profiler>
            );
            expect(onRender).toHaveBeenCalledTimes(1);
        });

        it('真实视口跨断点后，Col 的 padding 跟随新断点变化，但不产生额外渲染', async () => {
            await page.viewport(700, 600);
            const onRender = vi.fn<React.ProfilerOnRenderCallback>();
            const { container } = render(
                <Profiler id="row" onRender={onRender}>
                    <Row gutter={{ sm: 8, xxl: 40 }}>
                        <Col />
                    </Row>
                </Profiler>
            );
            const col = container.querySelector('.semi-col') as HTMLElement;
            await expect.poll(() => paddingLeft(col)).toBe('4px');
            expect(onRender).toHaveBeenCalledTimes(1);

            await page.viewport(1700, 600);
            await expect.poll(() => paddingLeft(col)).toBe('20px');
            expect(onRender).toHaveBeenCalledTimes(1);
        });
    });
});
