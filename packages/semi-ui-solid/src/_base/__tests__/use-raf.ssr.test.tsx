import { expect, it } from 'vite-plus/test';
import { renderServer, summarizeError } from '@test/solid/ssr.solid';
import useRaf from '../use-raf';

// The server has no cancelAnimationFrame, and renderToString disposes the root after rendering
it('服务端释放没有排过帧的 useRaf 不抛错', async () => {
    const { errors } = await renderServer({
        render: () => {
            useRaf();
            return null;
        },
    });
    expect(errors.map(summarizeError)).toEqual([]);
});
