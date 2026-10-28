import { describe, expect, it, vi } from 'vite-plus/test';
import AvatarFoundation, { type AvatarAdapter, type AvatarBaseProps } from '../foundation';

function createFoundation(props: AvatarBaseProps, widths: ReturnType<AvatarAdapter['getTextWidths']>) {
    const setScale = vi.fn<AvatarAdapter['setScale']>();
    const adapter = {
        getProp: (key: keyof AvatarBaseProps) => props[key],
        getProps: () => props,
        getTextWidths: () => widths,
        setScale,
    } as unknown as AvatarAdapter;
    return { foundation: new AvatarFoundation(adapter), setScale };
}

describe('AvatarFoundation.changeScale', () => {
    it('文字比扣除 gap 后的宽度更宽时按比例缩小', () => {
        const { foundation, setScale } = createFoundation({ gap: 3 }, { container: 40, text: 68 });
        foundation.init();
        expect(setScale).toHaveBeenCalledWith(0.5);
    });

    it('文字放得下时比例为 1', () => {
        const { foundation, setScale } = createFoundation({ gap: 3 }, { container: 40, text: 20 });
        foundation.changeScale();
        expect(setScale).toHaveBeenCalledWith(1);
    });

    it('没有文字内容或 gap 占满宽度时不缩放', () => {
        const noText = createFoundation({ gap: 3 }, null);
        noText.foundation.init();
        expect(noText.setScale).not.toHaveBeenCalled();
        const fullGap = createFoundation({ gap: 20 }, { container: 40, text: 20 });
        fullGap.foundation.changeScale();
        expect(fullGap.setScale).not.toHaveBeenCalled();
    });
});
