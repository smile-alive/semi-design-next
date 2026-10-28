import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import Highlight from '../index';
import type { HighlightProps } from '../interface';

const marks = (container: Element, tag = 'mark') => [...container.querySelectorAll<HTMLElement>(tag)];
const texts = (container: Element, tag = 'mark') => marks(container, tag).map((el) => el.textContent);
// The fragment root leaves empty anchor text nodes in the DOM; only these carry content.
const contentNodes = (container: Element) => [...container.childNodes].filter((node) => node.nodeType === Node.ELEMENT_NODE || node.textContent !== '');

describe('Highlight', () => {
    it('把匹配项渲染在 <mark class="semi-highlight-tag"> 中，其余保持纯文本', () => {
        const view = render(Highlight, { props: { searchWords: ['z'], sourceString: 'aaazaaazaaa' } });
        expect(texts(view.container)).toEqual(['z', 'z']);
        expect(marks(view.container).every((el) => el.className === 'semi-highlight-tag')).toBe(true);
        expect(view.container).toHaveTextContent(/^aaazaaazaaa$/);
        expect(contentNodes(view.container)).toHaveLength(5);
    });

    it('无匹配时原样渲染源文本，无源文本时不渲染', async () => {
        const view = render(Highlight, { props: { sourceString: 'Semi Design' } });
        expect(marks(view.container)).toHaveLength(0);
        expect(view.container).toHaveTextContent(/^Semi Design$/);

        await view.rerender({ searchWords: ['nothing'], sourceString: 'Semi Design' });
        expect(marks(view.container)).toHaveLength(0);
        expect(view.container).toHaveTextContent(/^Semi Design$/);

        await view.rerender({ searchWords: ['Semi'], sourceString: '' });
        expect(contentNodes(view.container)).toHaveLength(0);
    });

    it('忽略 searchWords 中的空项', () => {
        const searchWords = [undefined, null, '', 'Semi'] as unknown as HighlightProps['searchWords'];
        const view = render(Highlight, { props: { searchWords, sourceString: 'Semi Design' } });
        expect(texts(view.container)).toEqual(['Semi']);
    });

    it('除非设置 caseSensitive，否则匹配不区分大小写', async () => {
        const view = render(Highlight, { props: { searchWords: ['semi'], sourceString: 'Semi semi SEMI' } });
        expect(texts(view.container)).toEqual(['Semi', 'semi', 'SEMI']);
        await view.rerender({ caseSensitive: true });
        expect(texts(view.container)).toEqual(['semi']);
    });

    it('默认转义搜索词，autoEscape 为 false 时将其视为正则', async () => {
        const view = render(Highlight, { props: { searchWords: ['a.c'], sourceString: 'abc a.c' } });
        expect(texts(view.container)).toEqual(['a.c']);
        await view.rerender({ autoEscape: false });
        expect(texts(view.container)).toEqual(['abc', 'a.c']);
    });

    it('按字面匹配正则特殊字符', () => {
        const source = 'a+b (c) [d] 1.5 ^$ x|y \\w';
        const view = render(Highlight, {
            props: { searchWords: ['a+b', '(c)', '[d]', '1.5', '^$', 'x|y', '\\w'], sourceString: source },
        });
        expect(texts(view.container)).toEqual(['a+b', '(c)', '[d]', '1.5', '^$', 'x|y', '\\w']);
        expect(view.container).toHaveTextContent(source);
    });

    it('合并多个搜索词的重叠匹配，并忽略空词', () => {
        const view = render(Highlight, {
            props: { searchWords: ['do', '', 'dollar', { text: '' }], sourceString: 'aaa do dollar aaa' },
        });
        expect(texts(view.container)).toEqual(['do', 'dollar']);
        expect(view.container).toHaveTextContent(/^aaa do dollar aaa$/);
    });

    it('searchWords 可以是单个字符串', () => {
        const view = render(Highlight, { props: { searchWords: 'Design', sourceString: 'Semi Design' } });
        expect(texts(view.container)).toEqual(['Design']);
    });

    it('在每个匹配上追加 highlightClassName 并应用 highlightStyle', () => {
        const view = render(Highlight, {
            props: {
                highlightClassName: 'kw',
                highlightStyle: { color: 'red' },
                searchWords: ['Semi'],
                sourceString: 'Semi Design Semi',
            },
        });
        const found = marks(view.container);
        expect(found).toHaveLength(2);
        for (const el of found) {
            expect(el.className).toBe('semi-highlight-tag kw');
            expect(el).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        }
    });

    it('每个词的 class 与 style 叠加在共享样式之上', () => {
        const view = render(Highlight, {
            props: {
                highlightClassName: 'kw',
                highlightStyle: { color: 'red', fontWeight: 'bold' },
                searchWords: [{ text: 'Semi', class: 'w1', style: { color: 'blue' } }, 'Design'],
                sourceString: 'Semi Design',
            },
        });
        const [semi, design] = marks(view.container);
        expect(semi?.className).toBe('semi-highlight-tag kw w1');
        expect(semi?.getAttribute('style')).toBe('color: blue; font-weight: bold;');
        expect(design?.className).toBe('semi-highlight-tag kw');
        expect(design?.getAttribute('style')).toBe('color: red; font-weight: bold;');
    });

    it('相邻的不同样式搜索词各自渲染一个 mark', () => {
        const view = render(Highlight, {
            props: {
                searchWords: [
                    { text: 'Semi', class: 'a' },
                    { text: 'Design', class: 'b' },
                ],
                sourceString: 'SemiDesign',
            },
        });
        const [first, second] = marks(view.container);
        expect(marks(view.container)).toHaveLength(2);
        expect(first).toHaveClass('a');
        expect(second).toHaveClass('b');
    });

    it('通过 component 使用自定义标签渲染匹配项', () => {
        const view = render(Highlight, {
            props: { component: 'span', searchWords: ['Design'], sourceString: 'Semi Design' },
        });
        expect(marks(view.container)).toHaveLength(0);
        expect(texts(view.container, 'span.semi-highlight-tag')).toEqual(['Design']);
    });

    it('属性变化时更新', async () => {
        const view = render(Highlight, { props: { searchWords: ['Semi'], sourceString: 'Semi Design' } });
        expect(texts(view.container)).toEqual(['Semi']);
        await view.rerender({ searchWords: ['Design'] });
        expect(texts(view.container)).toEqual(['Design']);
    });

    it('丢弃 class、style 与 id，且没有 Vue 告警', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const view = render(Highlight, {
            attrs: { class: 'wrap', style: 'color: red', id: 'h' },
            props: { searchWords: ['Semi'], sourceString: 'Semi Design' },
        });
        expect(view.container.querySelector('.wrap')).toBeNull();
        expect(view.container.querySelector('#h')).toBeNull();
        expect(marks(view.container)[0]).not.toHaveAttribute('style');
        expect(warn).not.toHaveBeenCalled();
    });

    it('数值样式不补 px，无单位属性照常生效', () => {
        const view = render(Highlight, {
            props: {
                highlightStyle: { padding: 4, fontWeight: 600 } as HighlightProps['highlightStyle'],
                searchWords: ['Semi'],
                sourceString: 'Semi',
            },
        });
        const [mark] = marks(view.container);
        expect(mark?.style.padding).toBe('');
        expect(mark?.style.fontWeight).toBe('600');
    });

    it('读取 app 的全局默认值，显式属性优先', async () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Highlight: { component: 'span', caseSensitive: true } };
        const global = { provide: { [semiGlobalKey]: semi } };
        const view = render(Highlight, { global, props: { searchWords: ['semi'], sourceString: 'Semi semi' } });
        expect(texts(view.container, 'span.semi-highlight-tag')).toEqual(['semi']);
        await view.rerender({ component: 'mark', caseSensitive: false });
        expect(texts(view.container)).toEqual(['Semi', 'semi']);
    });

    it('非函数全局默认值按实例缓存，修改全局配置不影响已有实例', async () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Highlight: { component: 'span' } };
        const global = { provide: { [semiGlobalKey]: semi } };
        const view = render(Highlight, { global, props: { searchWords: ['semi'], sourceString: 'Semi semi' } });
        semi.config.overrideDefaultProps = { Highlight: { component: 'mark' } };
        await view.rerender({ sourceString: 'Semi semi semi' });
        expect(texts(view.container, 'span.semi-highlight-tag')).toEqual(['Semi', 'semi', 'semi']);
    });
});
