import { describe, expect, it, vi } from 'vite-plus/test';
import PinCodeFoundation, { type PinCodeAdapter, type PinCodeBaseProps } from '../foundation';

function createFoundation(format: PinCodeBaseProps['format'] = 'mixed') {
    const adapter = { getProp: () => format } as unknown as PinCodeAdapter;
    const foundation = new PinCodeFoundation(adapter);
    const removeCell = vi.spyOn(foundation, 'removeCell').mockImplementation(() => {});
    const completeSingleInput = vi.spyOn(foundation, 'completeSingleInput').mockResolvedValue();
    return { foundation, removeCell, completeSingleInput };
}

describe('PinCodeFoundation.handleCellChange', () => {
    it('空值删除该格', () => {
        const { foundation, removeCell, completeSingleInput } = createFoundation();
        foundation.handleCellChange(2, '', null);
        expect(removeCell).toHaveBeenCalledWith(2);
        expect(completeSingleInput).not.toHaveBeenCalled();
    });

    it('data 恰为一个码点时取 data', () => {
        const { foundation, completeSingleInput } = createFoundation();
        foundation.handleCellChange(0, '1a', 'a');
        expect(completeSingleInput).toHaveBeenCalledWith(0, 'a');
    });

    it('没有 data（自动填充）或 data 多于一个码点时取新值末位', () => {
        const { foundation, completeSingleInput } = createFoundation();
        foundation.handleCellChange(0, '12', null);
        foundation.handleCellChange(1, '34', 'ab');
        expect(completeSingleInput).toHaveBeenNthCalledWith(1, 0, '2');
        expect(completeSingleInput).toHaveBeenNthCalledWith(2, 1, '4');
    });

    it('按码点取字符，不把 emoji 拆成代理对', () => {
        const { foundation, completeSingleInput } = createFoundation(/^.$/u);
        foundation.handleCellChange(0, 'a😀', undefined);
        expect(completeSingleInput).toHaveBeenCalledWith(0, '😀');
    });

    it('校验不通过时不写入', () => {
        const { foundation, completeSingleInput } = createFoundation('number');
        foundation.handleCellChange(0, 'x', 'x');
        expect(completeSingleInput).not.toHaveBeenCalled();
    });
});
