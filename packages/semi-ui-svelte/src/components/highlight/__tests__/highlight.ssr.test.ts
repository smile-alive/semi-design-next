import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import Highlight from '../highlight.svelte';

describe('Svelte Highlight 服务端渲染', () => {
    it('首帧输出高亮标签', () => {
        const { body } = render(Highlight, { props: { searchWords: ['Design'], sourceString: 'Semi Design' } });
        expect(body).toMatch(/<mark class="semi-highlight-tag">Design(<!---->)?<\/mark>/);
        expect(body).toContain('Semi ');
    });
});
