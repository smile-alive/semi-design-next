import { expect, it } from 'vite-plus/test';
import { renderServer, summarizeError } from '@test/solid/ssr.solid';
import SolidResizeObserver from '..';

it('服务端渲染子元素，渲染与释放都不抛错', async () => {
    const { html, errors } = await renderServer({
        render: () => (
            <SolidResizeObserver observeParent>
                <div>child</div>
            </SolidResizeObserver>
        ),
    });
    expect(errors.map(summarizeError)).toEqual([]);
    expect(html).toContain('child');
});
