import { expect, it } from 'vite-plus/test';
import { renderServer, summarizeError } from '@test/solid/ssr.solid';
import useBreakpoint from '../use-breakpoint';

it('服务端渲染 useBreakpoint 的断点全为 false', async () => {
    const { html, errors } = await renderServer({
        render: () => {
            const screens = useBreakpoint();
            return <p>{JSON.stringify(screens())}</p>;
        },
    });
    expect(errors.map(summarizeError)).toEqual([]);
    expect(html).not.toContain('true');
    expect(html).toContain('false');
});
