import { StrictMode } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import Highlight from '../index';

const marks = (container, tag = 'mark') => [...container.querySelectorAll(tag)];
const texts = (container, tag = 'mark') => marks(container, tag).map((el) => el.textContent);

describe('Highlight', () => {
    it('把匹配项渲染在 <mark class="semi-highlight-tag"> 中，其余保持纯文本', () => {
        const { container } = render(
            <div>
                <Highlight searchWords={['z']} sourceString="aaazaaazaaa" />
            </div>
        );
        expect(texts(container)).toEqual(['z', 'z']);
        expect(marks(container).every((el) => el.className === 'semi-highlight-tag')).toBe(true);
        expect(container.firstChild).toHaveTextContent(/^aaazaaazaaa$/);
        expect(container.firstChild.childNodes).toHaveLength(5);
    });

    it('文本与序号拼接后相同的高亮块不产生重复 key', () => {
        // chunk 1 is "a1" and chunk 11 is "a": both would be keyed "a11"
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { container } = render(
            <div>
                <Highlight searchWords={['a1', 'a']} sourceString="-a1-a-a-a-a-a-" />
            </div>
        );
        expect(texts(container)).toEqual(['a1', 'a', 'a', 'a', 'a', 'a']);
        expect(error).not.toHaveBeenCalled();
        error.mockRestore();
    });

    it('无匹配时原样渲染源文本，无源文本时不渲染', () => {
        const { container, rerender } = render(
            <div>
                <Highlight sourceString="Semi Design" />
            </div>
        );
        expect(marks(container)).toHaveLength(0);
        expect(container.firstChild).toHaveTextContent(/^Semi Design$/);

        rerender(
            <div>
                <Highlight searchWords={['nothing']} sourceString="Semi Design" />
            </div>
        );
        expect(marks(container)).toHaveLength(0);
        expect(container.firstChild).toHaveTextContent(/^Semi Design$/);

        rerender(
            <div>
                <Highlight searchWords={['Semi']} />
            </div>
        );
        expect(container.firstChild).toBeEmptyDOMElement();
    });

    it('忽略 searchWords 中的空项', () => {
        const { container } = render(
            <div>
                <Highlight searchWords={[undefined, null, '', 'Semi']} sourceString="Semi Design" />
            </div>
        );
        expect(texts(container)).toEqual(['Semi']);
    });

    it('除非设置 caseSensitive，否则匹配不区分大小写', () => {
        const { container, rerender } = render(
            <div>
                <Highlight searchWords={['semi']} sourceString="Semi semi SEMI" />
            </div>
        );
        expect(texts(container)).toEqual(['Semi', 'semi', 'SEMI']);

        rerender(
            <div>
                <Highlight caseSensitive searchWords={['semi']} sourceString="Semi semi SEMI" />
            </div>
        );
        expect(texts(container)).toEqual(['semi']);
    });

    it('默认转义搜索词，autoEscape={false} 时将其视为正则', () => {
        const { container, rerender } = render(
            <div>
                <Highlight searchWords={['a.c']} sourceString="abc a.c" />
            </div>
        );
        expect(texts(container)).toEqual(['a.c']);

        rerender(
            <div>
                <Highlight autoEscape={false} searchWords={['a.c']} sourceString="abc a.c" />
            </div>
        );
        expect(texts(container)).toEqual(['abc', 'a.c']);
    });

    it('按字面匹配正则特殊字符', () => {
        const source = 'a+b (c) [d] 1.5 ^$ x|y \\w';
        const { container } = render(
            <div>
                <Highlight searchWords={['a+b', '(c)', '[d]', '1.5', '^$', 'x|y', '\\w']} sourceString={source} />
            </div>
        );
        expect(texts(container)).toEqual(['a+b', '(c)', '[d]', '1.5', '^$', 'x|y', '\\w']);
        expect(container.firstChild).toHaveTextContent(source);
    });

    it('合并多个搜索词的重叠匹配，并忽略空词', () => {
        const { container } = render(
            <div>
                <Highlight searchWords={['do', '', 'dollar', { text: '' }]} sourceString="aaa do dollar aaa" />
            </div>
        );
        expect(texts(container)).toEqual(['do', 'dollar']);
        expect(container.firstChild).toHaveTextContent(/^aaa do dollar aaa$/);
    });

    it('searchWords 可以是单个字符串', () => {
        const { container } = render(
            <div>
                <Highlight searchWords="Design" sourceString="Semi Design" />
            </div>
        );
        expect(texts(container)).toEqual(['Design']);
    });

    it('在每个匹配上追加 highlightClassName 并应用 highlightStyle', () => {
        const { container } = render(
            <div>
                <Highlight highlightClassName="kw" highlightStyle={{ color: 'red' }} searchWords={['Semi']} sourceString="Semi Design Semi" />
            </div>
        );
        const found = marks(container);
        expect(found).toHaveLength(2);
        for (const el of found) {
            expect(el.className).toBe('semi-highlight-tag kw');
            expect(el).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        }
    });

    it('每个词的 className 与 style 叠加在共享样式之上', () => {
        const { container } = render(
            <div>
                <Highlight highlightClassName="kw" highlightStyle={{ color: 'red', fontWeight: 'bold' }} searchWords={[{ text: 'Semi', className: 'w1', style: { color: 'blue' } }, 'Design']} sourceString="Semi Design" />
            </div>
        );
        const [semi, design] = marks(container);
        expect(semi.className).toBe('semi-highlight-tag kw w1');
        expect(semi.getAttribute('style')).toBe('color: blue; font-weight: bold;');
        expect(design.className).toBe('semi-highlight-tag kw');
        expect(design.getAttribute('style')).toBe('color: red; font-weight: bold;');
    });

    it('通过 component 使用自定义标签渲染匹配项', () => {
        const { container } = render(
            <div>
                <Highlight component="span" searchWords={['Design']} sourceString="Semi Design" />
            </div>
        );
        expect(marks(container)).toHaveLength(0);
        expect(texts(container, 'span.semi-highlight-tag')).toEqual(['Design']);
    });

    it('属性变化时更新', () => {
        const { container, rerender } = render(
            <div>
                <Highlight searchWords={['Semi']} sourceString="Semi Design" />
            </div>
        );
        expect(texts(container)).toEqual(['Semi']);
        rerender(
            <div>
                <Highlight searchWords={['Design']} sourceString="Semi Design" />
            </div>
        );
        expect(texts(container)).toEqual(['Design']);
    });

    it('StrictMode 下渲染结果一致', () => {
        const { container } = render(
            <StrictMode>
                <div>
                    <Highlight searchWords={['Semi']} sourceString="Semi Design" />
                </div>
            </StrictMode>
        );
        expect(texts(container)).toEqual(['Semi']);
        expect(container.firstChild).toHaveTextContent(/^Semi Design$/);
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Highlight: { component: 'span', caseSensitive: true } };
        try {
            const { container, rerender } = render(
                <div>
                    <Highlight searchWords={['semi']} sourceString="Semi semi" />
                </div>
            );
            expect(texts(container, 'span.semi-highlight-tag')).toEqual(['semi']);
            rerender(
                <div>
                    <Highlight component="mark" caseSensitive={false} searchWords={['semi']} sourceString="Semi semi" />
                </div>
            );
            expect(texts(container)).toEqual(['Semi', 'semi']);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });
});
