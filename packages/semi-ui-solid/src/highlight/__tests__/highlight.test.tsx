import { createSignal } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import Highlight, { type HighlightProps } from '..';
import semiGlobal from '../../_utils/semi-global';

const marks = (container: HTMLElement, tag = 'mark') => [...container.querySelectorAll(tag)];
const texts = (container: HTMLElement, tag = 'mark') => marks(container, tag).map((el) => el.textContent);

describe('Highlight', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('把匹配项渲染在 <mark class="semi-highlight-tag"> 中，其余保持纯文本', () => {
        const { container } = render(() => (
            <div>
                <Highlight searchWords={['z']} sourceString="aaazaaazaaa" />
            </div>
        ));
        expect(texts(container)).toEqual(['z', 'z']);
        expect(marks(container).every((el) => el.className === 'semi-highlight-tag')).toBe(true);
        expect(container.firstChild).toHaveTextContent(/^aaazaaazaaa$/);
    });

    it('无匹配时原样渲染源文本，无源文本时不渲染', () => {
        const [props, setProps] = createSignal<HighlightProps>({ sourceString: 'Semi Design' });
        const { container } = render(() => (
            <div>
                <Highlight {...props()} />
            </div>
        ));
        expect(marks(container)).toHaveLength(0);
        expect(container.firstChild).toHaveTextContent(/^Semi Design$/);

        setProps({ searchWords: ['nothing'], sourceString: 'Semi Design' });
        expect(marks(container)).toHaveLength(0);
        expect(container.firstChild).toHaveTextContent(/^Semi Design$/);

        setProps({ searchWords: ['Semi'] });
        expect(container.firstChild).toHaveTextContent(/^$/);
    });

    it('忽略 searchWords 中的空项', () => {
        const { container } = render(() => (
            <div>
                <Highlight searchWords={[undefined, null as unknown as undefined, '', 'Semi']} sourceString="Semi Design" />
            </div>
        ));
        expect(texts(container)).toEqual(['Semi']);
    });

    it('除非设置 caseSensitive，否则匹配不区分大小写', () => {
        const [caseSensitive, setCaseSensitive] = createSignal(false);
        const { container } = render(() => (
            <div>
                <Highlight caseSensitive={caseSensitive()} searchWords={['semi']} sourceString="Semi semi SEMI" />
            </div>
        ));
        expect(texts(container)).toEqual(['Semi', 'semi', 'SEMI']);
        setCaseSensitive(true);
        expect(texts(container)).toEqual(['semi']);
    });

    it('默认转义搜索词，autoEscape={false} 时将其视为正则', () => {
        const [autoEscape, setAutoEscape] = createSignal(true);
        const { container } = render(() => (
            <div>
                <Highlight autoEscape={autoEscape()} searchWords={['a.c']} sourceString="abc a.c" />
            </div>
        ));
        expect(texts(container)).toEqual(['a.c']);
        setAutoEscape(false);
        expect(texts(container)).toEqual(['abc', 'a.c']);
    });

    it('按字面匹配正则特殊字符', () => {
        const source = 'a+b (c) [d] 1.5 ^$ x|y \\w';
        const { container } = render(() => (
            <div>
                <Highlight searchWords={['a+b', '(c)', '[d]', '1.5', '^$', 'x|y', '\\w']} sourceString={source} />
            </div>
        ));
        expect(texts(container)).toEqual(['a+b', '(c)', '[d]', '1.5', '^$', 'x|y', '\\w']);
        expect(container.firstChild).toHaveTextContent(source);
    });

    it('合并多个搜索词的重叠匹配，并忽略空词', () => {
        const { container } = render(() => (
            <div>
                <Highlight searchWords={['do', '', 'dollar', { text: '' }]} sourceString="aaa do dollar aaa" />
            </div>
        ));
        expect(texts(container)).toEqual(['do', 'dollar']);
        expect(container.firstChild).toHaveTextContent(/^aaa do dollar aaa$/);
    });

    it('searchWords 可以是单个字符串', () => {
        const { container } = render(() => (
            <div>
                <Highlight searchWords="Design" sourceString="Semi Design" />
            </div>
        ));
        expect(texts(container)).toEqual(['Design']);
    });

    it('在每个匹配上追加 highlightClassName 并应用 highlightStyle', () => {
        const { container } = render(() => (
            <div>
                <Highlight highlightClassName="kw" highlightStyle={{ color: 'red' }} searchWords={['Semi']} sourceString="Semi Design Semi" />
            </div>
        ));
        const found = marks(container);
        expect(found).toHaveLength(2);
        for (const el of found) {
            expect(el.className).toBe('semi-highlight-tag kw');
            expect(el).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        }
    });

    it('每个词的 class 与 style 叠加在共享样式之上', () => {
        const { container } = render(() => (
            <div>
                <Highlight highlightClassName="kw" highlightStyle={{ color: 'red', 'font-weight': 'bold' }} searchWords={[{ text: 'Semi', class: 'w1', style: { color: 'blue' } }, 'Design']} sourceString="Semi Design" />
            </div>
        ));
        const [semi, design] = marks(container);
        expect(semi.className).toBe('semi-highlight-tag kw w1');
        expect(semi.getAttribute('style')).toBe('color: blue; font-weight: bold;');
        expect(design.className).toBe('semi-highlight-tag kw');
        expect(design.getAttribute('style')).toBe('color: red; font-weight: bold;');
    });

    it('通过 component 使用自定义标签渲染匹配项', () => {
        const { container } = render(() => (
            <div>
                <Highlight component="span" searchWords={['Design']} sourceString="Semi Design" />
            </div>
        ));
        expect(marks(container)).toHaveLength(0);
        expect(texts(container, 'span.semi-highlight-tag')).toEqual(['Design']);
    });

    it('属性变化时更新', () => {
        const [word, setWord] = createSignal('Semi');
        const { container } = render(() => (
            <div>
                <Highlight searchWords={[word()]} sourceString="Semi Design" />
            </div>
        ));
        expect(texts(container)).toEqual(['Semi']);
        setWord('Design');
        expect(texts(container)).toEqual(['Design']);
        expect(container.firstChild).toHaveTextContent(/^Semi Design$/);
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Highlight: { component: 'span', caseSensitive: true } };
        const { container } = render(() => (
            <div>
                <Highlight searchWords={['semi']} sourceString="Semi semi" />
            </div>
        ));
        expect(texts(container, 'span.semi-highlight-tag')).toEqual(['semi']);
        const { container: explicit } = render(() => (
            <div>
                <Highlight component="mark" caseSensitive={false} searchWords={['semi']} sourceString="Semi semi" />
            </div>
        ));
        expect(texts(explicit)).toEqual(['Semi', 'semi']);
    });

    it('不产生控制台错误', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        render(() => <Highlight searchWords={['a1', 'a']} sourceString="-a1-a-a-a-a-a-" />);
        expect(error).not.toHaveBeenCalled();
    });
});
