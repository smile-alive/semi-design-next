import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import CodeHighlight from '../code-highlight.svelte';

describe('Svelte CodeHighlight 服务端渲染', () => {
    it('只输出纯文本 pre > code', () => {
        const { body } = render(CodeHighlight, { props: { code: 'const a = 1;', language: 'js' } });
        expect(body).toMatch(/<div class="semi-codeHighlight[^"]*"><pre><code>const a = 1;/);
        expect(body).not.toContain('shiki');
    });
});
