import { expect, it } from 'vite-plus/test';
import { renderServer, summarizeError } from '@test/solid/ssr.solid';
import Tooltip from '..';

// The server resolves an element child to markup, not a DOM node, so the trigger span cannot ask for Text or HTMLElement
it('非函数子元素在服务端渲染进触发器 span', async () => {
    const { html, errors } = await renderServer({
        render: () => (
            <Tooltip content="Tooltip content">
                <span>Wrapped</span>
            </Tooltip>
        ),
    });
    expect(errors.map(summarizeError)).toEqual([]);
    expect(html).toContain('Wrapped');
});
