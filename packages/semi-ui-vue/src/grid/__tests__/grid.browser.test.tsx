/** @jsxImportSource vue */
import { nextTick } from 'vue';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { render } from '@test/utils/vue';
import { Col, Row, type RowProps } from '../index';

const q = (root: ParentNode, selector: string) => root.querySelector(selector) as Element;
const style = (el: Element, name: string) => getComputedStyle(el).getPropertyValue(name);
const marginLeft = (el: Element) => style(el, 'margin-left');
const marginRight = (el: Element) => style(el, 'margin-right');
const marginTop = (el: Element) => style(el, 'margin-top');
const paddingLeft = (el: Element) => style(el, 'padding-left');
const paddingRight = (el: Element) => style(el, 'padding-right');
const paddingTop = (el: Element) => style(el, 'padding-top');

const renderRow = (props: RowProps) => render(Row, { props, slots: { default: () => <Col /> } });

describe('Grid 浏览器', () => {
    afterEach(async () => {
        await page.viewport(1000, 660);
    });

    describe('断点 0 隐藏', () => {
        const displayAt = async (width: number, props: Record<string, unknown>) => {
            await page.viewport(width, 660);
            const { container } = render(() => <Row>{() => <Col {...props}>{() => 'col'}</Col>}</Row>);
            return getComputedStyle(q(container, '.semi-col')).display;
        };

        it('md 为 0 只在 md 及以上隐藏', async () => {
            expect(await displayAt(500, { md: 0 })).not.toBe('none');
            expect(await displayAt(700, { sm: 12, md: 0 })).not.toBe('none');
            expect(await displayAt(1000, { md: 0 })).toBe('none');
        });

        it('xs 有跨度、md 为 0 时，md 视口隐藏', async () => {
            expect(await displayAt(1000, { xs: 24, md: 0 })).toBe('none');
            expect(await displayAt(500, { xs: 24, md: 0 })).toBe('block');
        });
    });

    // the browser project's 1000px viewport is the lg breakpoint, so lg overrides what xs set
    it('在更大断点处设置的 0 值 order、offset、push 和 pull 会重置较小断点的值', () => {
        const view = render(() => (
            <Row>
                {() => (
                    <Col lg={{ offset: 0, order: 0, pull: 0, push: 0, span: 6 }} xs={{ offset: 4, order: 2, pull: 4, push: 4, span: 6 }}>
                        {() => 'col'}
                    </Col>
                )}
            </Row>
        ));
        const col = getComputedStyle(q(view.container, '.semi-col'));
        expect({
            'inset-inline-start': col.getPropertyValue('inset-inline-start'),
            'inset-inline-end': col.getPropertyValue('inset-inline-end'),
            'margin-inline-start': col.getPropertyValue('margin-inline-start'),
            order: col.order,
        }).toEqual({
            'inset-inline-start': '0px',
            'inset-inline-end': '0px',
            'margin-inline-start': '0px',
            order: '0',
        });
    });

    describe('gutter：CSS 变量驱动的 margin/padding', () => {
        it('数字 gutter 只影响横向，纵向为 0', () => {
            const { container } = renderRow({ gutter: 16 });
            const row = q(container, '.semi-row');
            const col = q(container, '.semi-col');
            expect(marginLeft(row)).toBe('-8px');
            expect(marginRight(row)).toBe('-8px');
            expect(marginTop(row)).toBe('0px');
            expect(paddingLeft(col)).toBe('8px');
            expect(paddingRight(col)).toBe('8px');
            expect(paddingTop(col)).toBe('0px');
        });

        it('数组 gutter [横, 纵] 两个方向各自生效', () => {
            const { container } = renderRow({ gutter: [16, 24] });
            const row = q(container, '.semi-row');
            const col = q(container, '.semi-col');
            expect(marginLeft(row)).toBe('-8px');
            expect(marginTop(row)).toBe('-12px');
            expect(paddingLeft(col)).toBe('8px');
            expect(paddingTop(col)).toBe('12px');
        });

        it('gutter 为 0 或负数时，实际 margin 与 padding 都是 0', () => {
            const { container } = renderRow({ gutter: [0, -8] });
            const row = q(container, '.semi-row');
            const col = q(container, '.semi-col');
            expect(marginLeft(row)).toBe('0px');
            expect(marginTop(row)).toBe('0px');
            expect(paddingLeft(col)).toBe('0px');
            expect(paddingTop(col)).toBe('0px');
        });

        it('flex 布局下 gutter 的落点与普通布局一致（margin，而非 row-gap）', () => {
            const { container } = renderRow({ type: 'flex', gutter: [16, 24] });
            const row = q(container, '.semi-row-flex');
            const col = q(container, '.semi-col');
            expect(getComputedStyle(row).display).toBe('flex');
            expect(marginLeft(row)).toBe('-8px');
            expect(marginTop(row)).toBe('-12px');
            expect(paddingLeft(col)).toBe('8px');
            expect(paddingTop(col)).toBe('12px');
        });

        it('用户 style 只覆盖显式设置的一侧，另一侧仍由 gutter 的 CSS 决定', async () => {
            const { container } = render(Row, {
                attrs: { style: 'margin-left: 3px' },
                props: { gutter: [16, 24] },
                slots: { default: () => <Col /> },
            });
            const row = q(container, '.semi-row');
            await expect.poll(() => marginLeft(row)).toBe('3px');
            expect(marginRight(row)).toBe('-8px');
            expect(marginTop(row)).toBe('-12px');
        });

        it('嵌套 Row 完全覆盖外层的 gutter，不会泄漏外层断点的值', () => {
            const { container } = render(() => <Row gutter={20}>{() => <Col>{() => <Row gutter={8}>{() => <Col class="inner" />}</Row>}</Col>}</Row>);
            expect(paddingLeft(q(container, '.inner'))).toBe('4px');
        });

        it('Col 脱离 Row 时没有任何 gutter 变量可继承，padding 为 0', () => {
            const { container } = render(Col, { props: { span: 12 }, slots: { default: () => 'child' } });
            const col = q(container, '.semi-col');
            expect(paddingLeft(col)).toBe('0px');
            expect(paddingTop(col)).toBe('0px');
        });

        describe('响应式 gutter 对象在各断点下的实际值', () => {
            // breakpoints: xs <576, sm >=576, md >=768, lg >=992, xl >=1200, xxl >=1600
            const gutter = { xs: 4, md: 16, xl: 24 };

            it.each([
                [500, '-2px', '2px'],
                [700, '0px', '0px'],
                [800, '-8px', '8px'],
                [1000, '-8px', '8px'],
                [1300, '-12px', '12px'],
                [1700, '-12px', '12px'],
            ])('视口宽度 %dpx 时，margin 为 %s，padding 为 %s', async (width, expectedMargin, expectedPadding) => {
                await page.viewport(width, 600);
                const { container } = renderRow({ gutter });
                const row = q(container, '.semi-row');
                const col = q(container, '.semi-col');
                await expect.poll(() => marginLeft(row)).toBe(expectedMargin);
                expect(paddingLeft(col)).toBe(expectedPadding);
            });

            it('gutter prop 由数字改成响应式对象后，xxl 视口下 padding 随之更新', async () => {
                await page.viewport(1700, 600);
                const view = renderRow({ gutter: 8 });
                const col = q(view.container, '.semi-col');
                await expect.poll(() => paddingLeft(col)).toBe('4px');
                await view.rerender({ gutter: { sm: 8, xxl: 40 } });
                await expect.poll(() => paddingLeft(col)).toBe('20px');
            });
        });
    });

    describe('视口变化不触发重渲染', () => {
        const countUpdates = () => {
            const counter = { updated: 0 };
            return {
                counter,
                global: {
                    mixins: [
                        {
                            updated() {
                                counter.updated++;
                            },
                        },
                    ],
                },
            };
        };

        it('挂载响应式 gutter 的 Row 之后没有更新', async () => {
            const { counter, global } = countUpdates();
            render(Row, {
                global,
                props: { gutter: { xs: 4, md: 16, xl: 24 } },
                slots: { default: () => <Col /> },
            });
            await nextTick();
            expect(counter.updated).toBe(0);
        });

        it('真实视口跨断点后，Col 的 padding 跟随新断点变化，但不产生更新', async () => {
            await page.viewport(700, 600);
            const { counter, global } = countUpdates();
            const { container } = render(Row, {
                global,
                props: { gutter: { sm: 8, xxl: 40 } },
                slots: { default: () => <Col /> },
            });
            const col = q(container, '.semi-col');
            await expect.poll(() => paddingLeft(col)).toBe('4px');
            expect(counter.updated).toBe(0);

            await page.viewport(1700, 600);
            await expect.poll(() => paddingLeft(col)).toBe('20px');
            expect(counter.updated).toBe(0);
        });
    });
});
