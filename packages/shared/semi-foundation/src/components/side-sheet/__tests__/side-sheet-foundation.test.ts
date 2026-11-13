import { describe, expect, it, vi } from 'vite-plus/test';
import SideSheetFoundation, { type SideSheetAdapter, type SideSheetProps } from '../side-sheet-foundation';

function createFoundation(props: SideSheetProps) {
    const notifyAfterVisibleChange = vi.fn<(isVisible: boolean) => void>();
    const adapter = {
        getProp: (key: keyof SideSheetProps) => props[key],
        getProps: () => props,
        notifyAfterVisibleChange,
    } as unknown as SideSheetAdapter;
    return { foundation: new SideSheetFoundation(adapter), notifyAfterVisibleChange };
}

describe('SideSheetFoundation.handleHiddenChange', () => {
    it('挂载即可见时不报打开，卸载时报一次隐藏', () => {
        const { foundation, notifyAfterVisibleChange } = createFoundation({ visible: true });
        foundation.handleHiddenChange(true);
        foundation.handleHiddenChange(true);
        expect(notifyAfterVisibleChange.mock.calls).toEqual([[false]]);
    });

    it('从未显示时卸载不报隐藏', () => {
        const { foundation, notifyAfterVisibleChange } = createFoundation({ visible: false });
        foundation.handleHiddenChange(true);
        expect(notifyAfterVisibleChange).not.toHaveBeenCalled();
    });

    it('显示后隐藏各报一次，隐藏后卸载不再报', () => {
        const { foundation, notifyAfterVisibleChange } = createFoundation({ visible: false });
        foundation.handleHiddenChange(false);
        foundation.handleHiddenChange(true);
        foundation.handleHiddenChange(true);
        expect(notifyAfterVisibleChange.mock.calls).toEqual([[true], [false]]);
    });

    it('进场动画结束才报显示，离场中重新打开不重复报告，进场中关闭先补报显示', () => {
        const props: SideSheetProps = { visible: false };
        const { foundation, notifyAfterVisibleChange } = createFoundation(props);
        props.visible = true;
        foundation.handleHiddenChange(false);
        expect(notifyAfterVisibleChange).not.toHaveBeenCalled();
        foundation.handleAnimationEnd();
        expect(notifyAfterVisibleChange.mock.calls).toEqual([[true]]);

        props.visible = false;
        foundation.handleAnimationEnd();
        props.visible = true;
        foundation.handleAnimationEnd();
        expect(notifyAfterVisibleChange.mock.calls).toEqual([[true]]);

        props.visible = false;
        foundation.handleHiddenChange(true);
        props.visible = true;
        foundation.handleHiddenChange(false);
        props.visible = false;
        foundation.handleHiddenChange(true);
        expect(notifyAfterVisibleChange.mock.calls).toEqual([[true], [false], [true], [false]]);
    });
});

describe('SideSheetFoundation.getSheetSize', () => {
    it('左右方向使用 width，高度撑满', () => {
        expect(SideSheetFoundation.getSheetSize({ placement: 'right', width: 300, mask: true })).toEqual({ dialogWidth: 300, dialogHeight: '100%' });
    });

    it('上下方向宽度撑满，高度默认 448', () => {
        expect(SideSheetFoundation.getSheetSize({ placement: 'top', width: 300, mask: true })).toEqual({ dialogWidth: '100%', dialogHeight: 448 });
        expect(SideSheetFoundation.getSheetSize({ placement: 'bottom', height: 200, mask: true })).toEqual({ dialogWidth: '100%', dialogHeight: 200 });
    });

    it('上下方向设了 canVerticalSetWidth 时使用 width', () => {
        expect(SideSheetFoundation.getSheetSize({ placement: 'bottom', canVerticalSetWidth: true, width: '50%', mask: true })).toEqual({ dialogWidth: '50%', dialogHeight: 448 });
    });

    it('没有遮罩时宽度落在外层，对话框撑满外层', () => {
        expect(SideSheetFoundation.getSheetSize({ placement: 'left', width: '50%', mask: false })).toEqual({ rootWidth: '50%', dialogWidth: '100%', dialogHeight: '100%' });
    });

    it('没有宽度时不设置宽度', () => {
        expect(SideSheetFoundation.getSheetSize({ placement: 'left', mask: false })).toEqual({ dialogHeight: '100%' });
    });
});

describe('SideSheetFoundation.isModal', () => {
    it('只有渲染在 body 里的遮罩才算模态', () => {
        expect(SideSheetFoundation.isModal({ mask: true, inBody: true })).toBe(true);
        expect(SideSheetFoundation.isModal({ mask: true, inBody: false })).toBe(false);
        expect(SideSheetFoundation.isModal({ mask: false, inBody: true })).toBe(false);
        expect(SideSheetFoundation.isModal({ inBody: true })).toBe(false);
    });
});
