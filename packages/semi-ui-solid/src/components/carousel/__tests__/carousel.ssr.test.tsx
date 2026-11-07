import { expect, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import Carousel, { type CarouselProps } from '..';

function counter() {
    const count = { created: 0 };
    const Counted = () => {
        count.created += 1;
        return <b>arrow</b>;
    };
    return { count, Counted };
}

it('箭头内容只在显示箭头时创建一次', async () => {
    const shown = counter();
    const hidden = counter();
    const { html, errors } = await renderServer({
        render: () => (
            <>
                <Carousel autoPlay={false} leftArrow={<shown.Counted />} arrowProps={{ leftArrow: { props: { 'aria-label': 'Back' } } }}>
                    <div>one</div>
                    <div>two</div>
                </Carousel>
                <Carousel autoPlay={false} showArrow={false} leftArrow={<hidden.Counted />}>
                    <div>one</div>
                    <div>two</div>
                </Carousel>
            </>
        ),
    });
    expect(errors).toEqual([]);
    expect(html.match(/<b[^>]*>arrow<\/b>/g)).toHaveLength(1);
    expect(shown.count.created).toBe(1);
    expect(hidden.count.created).toBe(0);
});

it('arrowProps 的按钮数据不接受箭头内容', () => {
    // @ts-expect-error the arrow content is Carousel's leftArrow, not data in arrowProps
    const arrowProps: CarouselProps['arrowProps'] = { leftArrow: { children: 'L' } };
    expect(arrowProps).toBeDefined();
});
