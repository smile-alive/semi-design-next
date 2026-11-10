import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import ActionBarFoundation, { type ActionBarAdapter, type ActionBarState } from '../action-bar-foundation';

class Bar extends ActionBarFoundation<ActionBarAdapter<object>, object, ActionBarState> {
    getCopyText() {
        return undefined;
    }

    open = () => this.openMenu();
    close = () => this.closeMenu();
}

describe('ActionBarFoundation.isActionBarShown', () => {
    it.each([
        [{ showReset: true, finished: true, showAction: false }, true],
        [{ showReset: true, finished: false, showAction: false }, false],
        [{ showReset: false, finished: true, showAction: false }, false],
        [{ showReset: false, finished: false, showAction: true }, true],
    ])('%o -> %s', (input, expected) => {
        expect(ActionBarFoundation.isActionBarShown(input)).toBe(expected);
    });

    it('初始状态收起', () => {
        expect(ActionBarFoundation.getInitialState()).toEqual({ visible: false, showAction: false });
    });
});

describe('ActionBarFoundation', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const create = () => {
        let state: ActionBarState = { visible: false, showAction: false };
        const adapter = {
            getStates: () => state,
            setState: (partial: Partial<ActionBarState>) => {
                state = { ...state, ...partial };
            },
        };
        const bar = new Bar(adapter as unknown as ActionBarAdapter<object>);
        bar.init();
        return { bar, state: () => state };
    };

    it('关闭菜单后稍等再收起操作栏', () => {
        const { bar, state } = create();
        bar.open();
        bar.close();
        expect(state()).toEqual({ visible: false, showAction: true });
        vi.advanceTimersByTime(150);
        expect(state().showAction).toBe(false);
    });

    it('等待期间重新打开时不收起', () => {
        const { bar, state } = create();
        bar.open();
        bar.close();
        bar.open();
        vi.advanceTimersByTime(150);
        expect(state()).toEqual({ visible: true, showAction: true });
    });

    it('卸载后不再写入；重新挂载时补上没等完的收起', () => {
        const { bar, state } = create();
        bar.open();
        bar.close();
        bar.destroy();
        vi.advanceTimersByTime(150);
        expect(state().showAction).toBe(true);
        bar.init();
        expect(state().showAction).toBe(false);
    });
});
