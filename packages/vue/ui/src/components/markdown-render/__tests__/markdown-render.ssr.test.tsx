/** @jsxImportSource vue */
import { expect, it } from 'vite-plus/test';
import { renderOnServer } from '@test/utils/vue.ssr';
import MarkdownRender from '..';

it('md 的服务端 HTML 已含编译内容', async () => {
    const { html, warnings } = await renderOnServer(() => <MarkdownRender format="md" raw={'# Title\n\nbody **bold**'} />);
    expect(warnings).toEqual([]);
    expect(html).toContain('Title');
    expect(html).toContain('<strong');
});

it('mdx 的服务端 HTML 为空根节点', async () => {
    const { html } = await renderOnServer(() => <MarkdownRender format="mdx" raw="# Title" />);
    expect(html).not.toContain('Title');
});
