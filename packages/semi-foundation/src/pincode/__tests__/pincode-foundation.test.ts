import { describe, expect, it, vi } from 'vite-plus/test';
import PinCodeFoundation, { type PinCodeAdapter, type PinCodeBaseProps } from '../foundation';

function createFoundation(format: PinCodeBaseProps['format'] = 'mixed', initialValues: string[] = []) {
    const props: PinCodeBaseProps = { format, count: 6 };
    let valueList = initialValues;
    const notifyValueChange = vi.fn<PinCodeAdapter['notifyValueChange']>();
    const adapter = {
        getProp: (key: keyof PinCodeBaseProps) => props[key],
        getProps: () => props,
        getState: () => valueList,
        updateValueList: (next: string[]) => {
            valueList = next;
        },
        onCurrentActiveIndexChange: () => {},
        changeSpecificInputFocusState: () => {},
        notifyValueChange,
        notifyComplete: () => {},
    } as unknown as PinCodeAdapter;
    // handleCellChange starts the async write without awaiting it
    const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
    return { foundation: new PinCodeFoundation(adapter), notifyValueChange, settle };
}

describe('PinCodeFoundation.handleCellChange', () => {
    it('空值删除该格', async () => {
        const { foundation, notifyValueChange, settle } = createFoundation('mixed', ['1', '2', '3']);
        foundation.handleCellChange(1, '', null);
        await settle();
        expect(notifyValueChange.mock.calls).toEqual([[['1', '3']]]);
    });

    it('data 恰为一个码点时取 data', async () => {
        const { foundation, notifyValueChange, settle } = createFoundation();
        foundation.handleCellChange(0, '1a', 'a');
        await settle();
        expect(notifyValueChange.mock.calls).toEqual([[['a']]]);
    });

    it('没有 data（自动填充）或 data 多于一个码点时取新值末位', async () => {
        const { foundation, notifyValueChange, settle } = createFoundation();
        foundation.handleCellChange(0, '12', null);
        await settle();
        foundation.handleCellChange(1, '34', 'ab');
        await settle();
        expect(notifyValueChange.mock.calls).toEqual([[['2']], [['2', '4']]]);
    });

    it('按码点取字符，不把 emoji 拆成代理对', async () => {
        const { foundation, notifyValueChange, settle } = createFoundation(/^.$/u);
        foundation.handleCellChange(0, 'a😀', undefined);
        await settle();
        expect(notifyValueChange.mock.calls).toEqual([[['😀']]]);
    });

    it('校验不通过时不写入', async () => {
        const { foundation, notifyValueChange, settle } = createFoundation('number');
        foundation.handleCellChange(0, 'x', 'x');
        await settle();
        expect(notifyValueChange).not.toHaveBeenCalled();
    });
});
