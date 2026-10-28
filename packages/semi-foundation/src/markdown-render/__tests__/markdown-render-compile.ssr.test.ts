import { describe, expect, it } from 'vite-plus/test';
import MarkdownRenderFoundation from '../foundation';

const runtime = {
    Fragment: Symbol('Fragment'),
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
};

describe('MarkdownRenderFoundation.compileMdSync 在 Node 中', () => {
    it('md 同步编译出含标题文字的树', () => {
        const content = MarkdownRenderFoundation.compileMdSync({ raw: '# Hello', format: 'md' }, runtime);
        if (!content) {
            throw new Error('compileMdSync returned null');
        }
        expect(JSON.stringify(content({}).props.children)).toContain('Hello');
    });

    it('异步插件 reject 时返回 null 且不产生未处理的 rejection', async () => {
        const failingPlugin = () => async () => {
            throw new Error('async plugin failed');
        };
        expect(MarkdownRenderFoundation.compileMdSync({ raw: '# Hello', format: 'md', remarkPlugins: [failingPlugin] }, runtime)).toBeNull();
        await new Promise((resolve) => setTimeout(resolve, 0));
    });
});
