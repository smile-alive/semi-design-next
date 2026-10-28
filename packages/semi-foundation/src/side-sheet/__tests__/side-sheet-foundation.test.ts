import { describe, expect, it } from 'vite-plus/test';
import SideSheetFoundation from '../side-sheet-foundation';

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
