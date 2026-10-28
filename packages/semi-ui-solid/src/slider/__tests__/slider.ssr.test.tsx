import { expect, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import Slider, { type SliderProps } from '..';

it('slider/刻度节点由 renderMark 在服务端只为标签创建', async () => {
    const created: string[] = [];
    const { html, errors } = await renderServer({
        render: () => (
            <Slider
                defaultValue={30}
                aria-label="Volume"
                marks={{ 20: '20c', 40: '40c' }}
                tooltipOnMark
                renderMark={(value, label) => {
                    created.push(`${value}:${label}`);
                    return <b>{label}</b>;
                }}
            />
        ),
    });
    expect(errors).toEqual([]);
    // the mark tooltips stay closed, so only the labels call it
    expect(created).toEqual(['20:20c', '40:40c']);
    expect(html).toMatch(/<b[^>]*>20c<\/b>/);
});

it('slider/marks 不接受 JSX', () => {
    // @ts-expect-error nodes go through renderMark
    const marks: SliderProps['marks'] = { 20: <b>20c</b> };
    expect(marks).toBeDefined();
});
