import { describe, expect, it } from 'vite-plus/test';
import { escapeHtmlInMarkdown } from '../escape-html';

describe('escapeHtmlInMarkdown', () => {
    it('转义普通文本中的 <，保留行内代码', () => {
        expect(escapeHtmlInMarkdown('a <b> `<i>`')).toBe('a &lt;b> `<i>`');
    });

    it('保留顶格围栏代码块', () => {
        expect(escapeHtmlInMarkdown('```html\n<div>x</div>\n```\n<b>')).toBe('```html\n<div>x</div>\n```\n&lt;b>');
    });

    it('保留列表项内缩进 1 到 3 个空格的围栏代码块', () => {
        const text = '1. step\n   ```html\n   <div>x</div>\n   ```\n\n<b>after';
        expect(escapeHtmlInMarkdown(text)).toBe('1. step\n   ```html\n   <div>x</div>\n   ```\n\n&lt;b>after');
    });

    it('缩进的结束围栏同样关闭代码块', () => {
        expect(escapeHtmlInMarkdown('```\n<a>\n  ```\n<b>')).toBe('```\n<a>\n  ```\n&lt;b>');
    });

    it('未闭合的围栏一直保护到文末', () => {
        expect(escapeHtmlInMarkdown('```\n<a>\n<b>')).toBe('```\n<a>\n<b>');
    });

    it('波浪线围栏不会被反引号围栏关闭，更短的围栏也不关闭', () => {
        expect(escapeHtmlInMarkdown('~~~\n```\n<a>\n~~~\n<b>')).toBe('~~~\n```\n<a>\n~~~\n&lt;b>');
        expect(escapeHtmlInMarkdown('````\n```\n<a>\n````\n<b>')).toBe('````\n```\n<a>\n````\n&lt;b>');
    });

    it('多反引号行内代码保留，未配对的反引号不保护后面的 <', () => {
        expect(escapeHtmlInMarkdown('a ``<b>`x`` <c>')).toBe('a ``<b>`x`` &lt;c>');
        expect(escapeHtmlInMarkdown('a ` <b>')).toBe('a ` &lt;b>');
    });

    it('缩进 4 个空格的围栏不是围栏，其中的 < 仍被转义', () => {
        expect(escapeHtmlInMarkdown('    ```\n    <b>')).toBe('    ```\n    &lt;b>');
    });
});
