import { describe, expect, it } from 'vite-plus/test';
import InputNumberFoundation, { type InputNumberAdapter, type InputNumberBaseProps } from '../foundation';

class ParseProbe extends InputNumberFoundation {
    parse(value: string, needCheckPrec = true) {
        return this.doParse(value, needCheckPrec);
    }
}

const createProbe = (props: InputNumberBaseProps = {}) =>
    new ParseProbe({
        getProp: (key: keyof InputNumberBaseProps) => props[key],
        getProps: () => props,
    } as unknown as InputNumberAdapter);

describe('InputNumberFoundation.doParse 小数点检查', () => {
    it.each([
        ['12', 12],
        ['1.5', 1.5],
        ['0', 0],
        ['1.05', 1.05],
        ['10', 10],
        ['100', 100],
    ])('合法输入 %s 解析为数字', (input, expected) => {
        expect(createProbe().parse(input)).toBe(expected);
    });

    it.each([
        ['1.', 'trailing dot'],
        ['1.2.3', 'two dots'],
        ['1..2', 'two adjacent dots'],
        ['1.20', 'trailing zero after dot'],
        ['1.0', 'only zero after dot'],
        ['0.50', 'trailing zero'],
    ])('非法输入 %s 返回 NaN（%s）', (input) => {
        expect(createProbe().parse(input)).toBeNaN();
    });

    it('不检查小数点时多个小数点按 Number 规则解析', () => {
        expect(createProbe().parse('1.2.3', false)).toBeNaN();
        expect(createProbe().parse('1.20', false)).toBe(1.2);
    });
});
