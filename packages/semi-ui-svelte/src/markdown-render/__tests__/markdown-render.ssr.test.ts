import { render } from 'svelte/server';
import { expect, it } from 'vite-plus/test';
import MarkdownRender from '../markdown-render.svelte';

it('md 的服务端 HTML 已含编译内容', () => {
    const { body } = render(MarkdownRender, { props: { format: 'md', raw: '# Title\n\nbody **bold**' } });
    expect(body).toContain('Title');
    expect(body).toContain('<strong');
});

it('md 的服务端 HTML 已用默认组件渲染标题、链接、代码与表格', () => {
    const raw = '# Title\n\n[Semi](https://semi.design)\n\n```js\nlet a = 1;\n```\n\ninline `x`\n\n| A |\n| - |\n| cell |';
    const { body } = render(MarkdownRender, { props: { format: 'md', raw } });
    expect(body).toContain('semi-typography');
    expect(body).toContain('semi-markdownRender-component-header');
    expect(body).toContain('href="https://semi.design"');
    expect(body).toContain('semi-codeHighlight');
    expect(body).toContain('let a = 1;');
    expect(body).toContain('semi-markdownRender-simple-code');
    expect(body).toContain('semi-table-thead');
    expect(body).toContain('cell');
    // a highlighted block drops its pre wrapper, which cannot hold CodeHighlight's div
    expect(body).not.toMatch(/<pre[^>]*><div/);
});

it('mdx 的服务端 HTML 为空根节点', () => {
    const { body } = render(MarkdownRender, { props: { format: 'mdx', raw: '# Title' } });
    expect(body).not.toContain('Title');
    expect(body).toContain('semi-markdownRender');
});
