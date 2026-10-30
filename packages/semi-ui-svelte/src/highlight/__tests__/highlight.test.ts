import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import type { HighlightProps } from '../interface';
import HighlightStore from './highlight-store.svelte';

const marks = (container: Element, tag = 'mark') => [...container.querySelectorAll<HTMLElement>(tag)];
const texts = (container: Element, tag = 'mark') => marks(container, tag).map((el) => el.textContent);
const contentNodes = (container: Element) => [...container.childNodes].filter((node) => node.nodeType === Node.ELEMENT_NODE || node.textContent !== '');

function setup(props: HighlightProps, context?: Map<unknown, unknown>) {
    const store = createStore<HighlightProps>(props);
    const view = render(HighlightStore, { props: { store }, ...(context ? { context } : {}) });
    return { store, container: view.container };
}

describe('Svelte Highlight', () => {
    it('把匹配项渲染在 <mark class="semi-highlight-tag"> 中，其余保持纯文本', () => {
        const { container } = setup({ searchWords: ['z'], sourceString: 'aaazaaazaaa' });
        expect(texts(container)).toEqual(['z', 'z']);
        expect(marks(container).every((el) => el.className === 'semi-highlight-tag')).toBe(true);
        expect(container).toHaveTextContent(/^aaazaaazaaa$/);
        expect(contentNodes(container)).toHaveLength(5);
    });

    it('无匹配时原样渲染源文本，无源文本时不渲染', () => {
        const { store, container } = setup({ sourceString: 'Semi Design' });
        expect(marks(container)).toHaveLength(0);
        expect(container).toHaveTextContent(/^Semi Design$/);

        store.searchWords = ['nothing'];
        flushSync();
        expect(marks(container)).toHaveLength(0);
        expect(container).toHaveTextContent(/^Semi Design$/);

        store.searchWords = ['Semi'];
        store.sourceString = '';
        flushSync();
        expect(container.querySelector('mark')).toBeNull();
        expect(container.textContent).toBe('');
    });

    it('忽略 searchWords 中的空项', () => {
        const searchWords = [undefined, null, '', 'Semi'] as unknown as HighlightProps['searchWords'];
        const { container } = setup({ searchWords, sourceString: 'Semi Design' });
        expect(texts(container)).toEqual(['Semi']);
    });

    it('除非设置 caseSensitive，否则匹配不区分大小写', () => {
        const { store, container } = setup({ searchWords: ['semi'], sourceString: 'Semi semi SEMI' });
        expect(texts(container)).toEqual(['Semi', 'semi', 'SEMI']);
        store.caseSensitive = true;
        flushSync();
        expect(texts(container)).toEqual(['semi']);
    });

    it('默认转义搜索词，autoEscape 为 false 时将其视为正则', () => {
        const { store, container } = setup({ searchWords: ['a.c'], sourceString: 'abc a.c' });
        expect(texts(container)).toEqual(['a.c']);
        store.autoEscape = false;
        flushSync();
        expect(texts(container)).toEqual(['abc', 'a.c']);
    });

    it('按字面匹配正则特殊字符', () => {
        const source = 'a+b (c) [d] 1.5 ^$ x|y \\w';
        const { container } = setup({ searchWords: ['a+b', '(c)', '[d]', '1.5', '^$', 'x|y', '\\w'], sourceString: source });
        expect(texts(container)).toEqual(['a+b', '(c)', '[d]', '1.5', '^$', 'x|y', '\\w']);
        expect(container).toHaveTextContent(source);
    });

    it('合并多个搜索词的重叠匹配，并忽略空词', () => {
        const { container } = setup({ searchWords: ['do', '', 'dollar', { text: '' }], sourceString: 'aaa do dollar aaa' });
        expect(texts(container)).toEqual(['do', 'dollar']);
        expect(container).toHaveTextContent(/^aaa do dollar aaa$/);
    });

    it('searchWords 可以是单个字符串', () => {
        const { container } = setup({ searchWords: 'Design', sourceString: 'Semi Design' });
        expect(texts(container)).toEqual(['Design']);
    });

    it('在每个匹配上追加 highlightClassName 并应用 highlightStyle', () => {
        const { container } = setup({ highlightClassName: 'kw', highlightStyle: { color: 'red' }, searchWords: ['Semi'], sourceString: 'Semi Design Semi' });
        const found = marks(container);
        expect(found).toHaveLength(2);
        for (const el of found) {
            expect(el.className).toBe('semi-highlight-tag kw');
            expect(el).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        }
    });

    it('每个词的 class 与 style 叠加在共享样式之上', () => {
        const { container } = setup({
            highlightClassName: 'kw',
            highlightStyle: { color: 'red', fontWeight: 'bold' },
            searchWords: [{ text: 'Semi', class: 'w1', style: { color: 'blue' } }, 'Design'],
            sourceString: 'Semi Design',
        });
        const [semi, design] = marks(container);
        expect(semi?.className).toBe('semi-highlight-tag kw w1');
        expect(semi?.style.color).toBe('blue');
        expect(semi?.style.fontWeight).toBe('bold');
        expect(design?.className).toBe('semi-highlight-tag kw');
        expect(design?.style.color).toBe('red');
    });

    it('相邻的不同样式搜索词各自渲染一个 mark', () => {
        const { container } = setup({
            searchWords: [
                { text: 'Semi', class: 'a' },
                { text: 'Design', class: 'b' },
            ],
            sourceString: 'SemiDesign',
        });
        const [first, second] = marks(container);
        expect(marks(container)).toHaveLength(2);
        expect(first).toHaveClass('a');
        expect(second).toHaveClass('b');
    });

    it('通过 component 使用自定义标签渲染匹配项', () => {
        const { container } = setup({ component: 'span', searchWords: ['Design'], sourceString: 'Semi Design' });
        expect(marks(container)).toHaveLength(0);
        expect(texts(container, 'span.semi-highlight-tag')).toEqual(['Design']);
    });

    it('属性变化时更新', () => {
        const { store, container } = setup({ searchWords: ['Semi'], sourceString: 'Semi Design' });
        expect(texts(container)).toEqual(['Semi']);
        store.searchWords = ['Design'];
        flushSync();
        expect(texts(container)).toEqual(['Design']);
    });

    it('丢弃 class、style 与 id', () => {
        const store = createStore<Record<string, unknown>>({ class: 'wrap', style: 'color: red', id: 'h', searchWords: ['Semi'], sourceString: 'Semi Design' });
        const { container } = render(HighlightStore, { props: { store: store as HighlightProps } });
        expect(container.querySelector('.wrap')).toBeNull();
        expect(container.querySelector('#h')).toBeNull();
        expect(marks(container)[0]).not.toHaveAttribute('style');
    });

    it('读取全局默认值，显式属性优先', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Highlight: { component: 'span', caseSensitive: true } };
        const { store, container } = setup({ searchWords: ['semi'], sourceString: 'Semi semi' }, new Map([[semiGlobalKey, semi]]));
        expect(texts(container, 'span.semi-highlight-tag')).toEqual(['semi']);
        store.component = 'mark';
        store.caseSensitive = false;
        flushSync();
        expect(texts(container)).toEqual(['Semi', 'semi']);
    });
});
