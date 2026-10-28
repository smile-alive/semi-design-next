import { expect, it } from 'vite-plus/test';
import { renderServer, serverText, summarizeError } from '@test/solid/ssr.solid';
import MarkdownRender from '..';

it('md 表格在服务端渲染出表头与单元格', async () => {
    const { html, errors } = await renderServer({ render: () => <MarkdownRender format="md" raw={'| Name | Size |\n| --- | --- |\n| Semi | 2 |'} /> });
    expect(errors.map(summarizeError)).toEqual([]);
    const text = serverText(html);
    expect(text).toContain('Name');
    expect(text).toContain('Semi');
});
