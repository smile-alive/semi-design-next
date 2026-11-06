import { describe, expect, it, vi } from 'vite-plus/test';
import AvatarFoundation, { type AvatarAdapter, type AvatarBaseProps } from '../foundation';

function createFoundation(props: AvatarBaseProps, widths: { container: number; text: number } | null) {
    const setState = vi.fn<(state: object) => void>();
    const adapter = {
        getProp: (key: keyof AvatarBaseProps) => props[key],
        getProps: () => props,
        getAvatarElement: () => (widths ? ({ offsetWidth: widths.container } as HTMLElement) : null),
        getTextElement: () => (widths ? ({ offsetWidth: widths.text } as HTMLElement) : null),
        setState,
    } as unknown as AvatarAdapter;
    return { foundation: new AvatarFoundation(adapter), setState };
}

describe('AvatarFoundation.changeScale', () => {
    it('文字比扣除 gap 后的宽度更宽时按比例缩小', () => {
        const { foundation, setState } = createFoundation({ gap: 3 }, { container: 40, text: 68 });
        foundation.init();
        expect(setState).toHaveBeenCalledWith({ scale: 0.5 }, undefined);
    });

    it('文字放得下时比例为 1', () => {
        const { foundation, setState } = createFoundation({ gap: 3 }, { container: 40, text: 20 });
        foundation.changeScale();
        expect(setState).toHaveBeenCalledWith({ scale: 1 }, undefined);
    });

    it('没有文字内容或 gap 占满宽度时不缩放', () => {
        const noText = createFoundation({ gap: 3 }, null);
        noText.foundation.init();
        expect(noText.setState).not.toHaveBeenCalled();
        const fullGap = createFoundation({ gap: 20 }, { container: 40, text: 20 });
        fullGap.foundation.changeScale();
        expect(fullGap.setState).not.toHaveBeenCalled();
    });
});
