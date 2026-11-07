import { describe, expect, it } from 'vite-plus/test';
import FormatNumeral from '../format-numeral';

type Args = ConstructorParameters<typeof FormatNumeral>;

const format = (content: string, rule: Args[1], precision = 2, truncate: Args[3] = 'round', parser?: Args[4]) => new FormatNumeral(content, rule, precision, truncate, parser).format();

describe('FormatNumeral', () => {
    it.each([
        ['bytes-decimal', '999', '999.00 B'],
        ['bytes-decimal', '1500', '1.50 KB'],
        ['bytes-decimal', '2500000', '2.50 MB'],
        ['bytes-binary', '1024', '1.00 KiB'],
        ['bytes-binary', '1572864', '1.50 MiB'],
        ['percentages', '0.58', '58.00%'],
        ['percentages', '1.005', '100.50%'],
        ['exponential', '12345', '1.23e+4'],
        ['exponential', '0.00012', '1.20e-4'],
    ] as const)('%s 规则格式化 %s 为 %s', (rule, content, expected) => {
        expect(format(content, rule)).toBe(expected);
    });

    it('负数保留符号', () => {
        expect(format('-1500', 'bytes-decimal')).toBe('-1500.00 B');
        expect(format('-0.5', 'percentages')).toBe('-50.00%');
        expect(format('-12345', 'exponential')).toBe('-1.23e+4');
    });

    it('超出最大单位时停在 YB', () => {
        expect(format('1e30', 'bytes-decimal', 0)).toBe('1000000 YB');
        // 2 ** 90 written out: String() would give the `e+27` form
        expect(format('1237940039285380274899124224', 'bytes-binary', 0)).toBe('1024 YiB');
    });

    it('带 e+ 指数的科学计数法输入按一个数字处理', () => {
        expect(format(String(2 ** 90), 'bytes-binary', 0)).toBe('1024 YiB');
        expect(format('1.5e+3', 'bytes-decimal')).toBe('1.50 KB');
    });

    it('截断方式决定舍入方向，且小数位补零', () => {
        expect(format('1.2345', 'text', 2, 'ceil')).toBe('1.24');
        expect(format('1.2345', 'text', 2, 'floor')).toBe('1.23');
        expect(format('1', 'text', 3)).toBe('1.000');
    });

    it('指数记法的尾数进位到 10 时重新归一', () => {
        expect(format('9.996e3', 'exponential', 2)).toBe('1.00e+4');
        expect(format('9.991e3', 'exponential', 2, 'ceil')).toBe('1.00e+4');
    });

    it('text 只处理字符串里的数字，其余原样保留', () => {
        expect(format('v1.2345 and 7', 'text', 1)).toBe('v1.2 and 7.0');
    });

    it('numbers 只保留数字并以逗号连接', () => {
        expect(format('a1.234b-5c', 'numbers', 1)).toBe('1.2,-5.0');
    });

    it('独立的连字符与小数点不当作数字', () => {
        expect(format('a - b', 'text')).toBe('a - b');
        expect(format('1 - 2', 'text', 1)).toBe('1.0 - 2.0');
        expect(format('...', 'numbers')).toBe('');
    });

    it('自定义 parser 优先于规则', () => {
        expect(format('1500', 'bytes-decimal', 2, 'round', (value) => `<${value}>`)).toBe('<1500>');
    });

    it('不引入二进制浮点误差', () => {
        expect(format('0.58', 'percentages', 0)).toBe('58%');
        expect(format('1.005', 'text', 2)).toBe('1.01');
    });
});
