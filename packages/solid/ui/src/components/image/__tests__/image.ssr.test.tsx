import { expect, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import { ImagePreview } from '..';
import Header from '../preview-header';

function counter(text: string) {
    const state = { created: 0 };
    const Counted = () => {
        state.created += 1;
        return text;
    };
    return { state, Counted };
}

it('服务端不渲染预览弹层，不创建 title 与左右图标', async () => {
    const title = counter('title text');
    const left = counter('left text');
    const right = counter('right text');
    const calls = { left: 0, right: 0 };
    const { errors } = await renderServer({
        render: () => (
            <ImagePreview
                visible
                src={['a.png', 'b.png']}
                previewTitle={<title.Counted />}
                renderLeftIcon={() => {
                    calls.left += 1;
                    return <left.Counted />;
                }}
                renderRightIcon={() => {
                    calls.right += 1;
                    return <right.Counted />;
                }}
            />
        ),
    });
    expect(errors).toEqual([]);
    expect(title.state.created).toBe(0);
    expect(left.state.created).toBe(0);
    expect(right.state.created).toBe(0);
    expect(calls).toEqual({ left: 0, right: 0 });
});

it('closable 为 false 时头部不创建 renderCloseIcon', async () => {
    const icon = counter('icon text');
    const { html, errors } = await renderServer({ render: () => <Header closable={false} renderCloseIcon={<icon.Counted />} /> });
    expect(errors).toEqual([]);
    expect(html).not.toContain('icon text');
    expect(icon.state.created).toBe(0);
});
