import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import UserGuideFoundation, { type UserGuideAdapter, type UserGuideBaseProps, type UserGuideBaseState } from '../foundation';

function setup(initial: UserGuideBaseProps) {
    let props = initial;
    let state: UserGuideBaseState = UserGuideFoundation.getInitialState(props);
    const adapter = {
        getProps: () => props,
        getProp: (key: keyof UserGuideBaseProps) => props[key],
        getState: (key: keyof UserGuideBaseState) => state[key],
        getStates: () => state,
        setState: (partial: Partial<UserGuideBaseState>, cb?: () => void) => {
            state = { ...state, ...partial };
            cb?.();
        },
        getContext: () => undefined,
        getPopup: () => null,
        notifyChange: () => {},
        notifyPrev: () => {},
        notifyNext: () => {},
        notifySkip: () => {},
        notifyFinish: () => {},
    } as unknown as UserGuideAdapter;
    const foundation = new UserGuideFoundation(adapter);
    const update = (next: Partial<UserGuideBaseProps>) => {
        props = { ...props, ...next };
        foundation.handlePropsChange();
    };
    return { foundation, update, getState: () => state };
}

describe('UserGuideFoundation 的显示副作用', () => {
    afterEach(() => {
        vi.useRealTimers();
        document.body.replaceChildren();
        document.body.removeAttribute('style');
    });

    it('popup 显示时逐帧测量目标并锁滚动，隐藏后释放、停止测量并回到第一步', () => {
        vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
        const target = document.createElement('div');
        target.scrollIntoView = () => {};
        let rect = new DOMRect(10, 10, 20, 20);
        target.getBoundingClientRect = () => rect;
        document.body.append(target);
        const { foundation, update, getState } = setup({ visible: true, mode: 'popup', mask: true, spotlightPadding: 0, steps: [{ target }, { target }] });
        foundation.init();
        expect(getState().spotlightRect?.x).toBe(10);
        expect(document.body.style.overflow).toBe('hidden');

        rect = new DOMRect(40, 10, 20, 20);
        vi.advanceTimersToNextFrame();
        expect(getState().spotlightRect?.x).toBe(40);

        foundation.handleNext();
        expect(getState().current).toBe(1);
        update({ visible: false });
        expect(document.body.style.overflow).toBe('');
        expect(getState().current).toBe(0);
        rect = new DOMRect(80, 10, 20, 20);
        vi.advanceTimersToNextFrame();
        expect(getState().spotlightRect?.x).toBe(40);
    });

    it('目标还没出现时不锁滚动，出现后才锁', () => {
        vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
        const target = document.createElement('div');
        target.getBoundingClientRect = () => new DOMRect(10, 10, 20, 20);
        let present = false;
        const { foundation, getState } = setup({ visible: true, mode: 'popup', mask: true, steps: [{ target: () => (present ? target : null) }] });
        foundation.init();
        expect(getState().spotlightRect).toBeNull();
        expect(document.body.style.overflow).toBe('');
        present = true;
        vi.advanceTimersToNextFrame();
        expect(getState().spotlightRect).not.toBeNull();
        expect(document.body.style.overflow).toBe('hidden');
        foundation.destroy();
        expect(document.body.style.overflow).toBe('');
    });

    it('焦点在步骤离开屏幕时回到显示前的元素', () => {
        const trigger = document.createElement('button');
        const target = document.createElement('div');
        target.getBoundingClientRect = () => new DOMRect(10, 10, 20, 20);
        document.body.append(trigger, target);
        trigger.focus();
        const { foundation, update } = setup({ visible: true, mode: 'popup', mask: false, steps: [{ target }] });
        foundation.init();
        trigger.blur();
        update({ visible: false });
        expect(document.activeElement).toBe(trigger);
        foundation.destroy();
    });
});

describe('UserGuideFoundation 静态方法', () => {
    it('deriveCurrent 显示不为 undefined 的 current 属性，否则显示 state', () => {
        expect(UserGuideFoundation.deriveCurrent({ current: 2 }, { current: 0 })).toBe(2);
        expect(UserGuideFoundation.deriveCurrent({ current: 0 }, { current: 1 })).toBe(0);
        expect(UserGuideFoundation.deriveCurrent({ current: undefined }, { current: 1 })).toBe(1);
    });

    it('getSpotlightPadding 优先取 step，其次取组件，并保留 0', () => {
        expect(UserGuideFoundation.getSpotlightPadding({ spotlightPadding: 15 }, 10)).toBe(15);
        expect(UserGuideFoundation.getSpotlightPadding({ spotlightPadding: 0 }, 10)).toBe(0);
        expect(UserGuideFoundation.getSpotlightPadding({}, 10)).toBe(10);
        expect(UserGuideFoundation.getSpotlightPadding({}, 0)).toBe(0);
        expect(UserGuideFoundation.getSpotlightPadding(undefined, undefined)).toBe(5);
    });

    it('getTarget 取元素或调用函数，找不到时返回空值', () => {
        const el = document.createElement('div');
        expect(UserGuideFoundation.getTarget({ target: el })).toBe(el);
        expect(UserGuideFoundation.getTarget({ target: () => el })).toBe(el);
        expect(UserGuideFoundation.getTarget({ target: () => null })).toBeNull();
        expect(UserGuideFoundation.getTarget(undefined)).toBeUndefined();
    });

    it('measure 按外扩后的矩形返回，没有目标时返回 null，滚动只在需要时发生', () => {
        const el = document.createElement('div');
        el.getBoundingClientRect = () => new DOMRect(10, 20, 100, 30);
        const scrollIntoView = vi.fn<() => void>();
        el.scrollIntoView = scrollIntoView;
        const rect = UserGuideFoundation.measure({ target: el, spotlightPadding: 4 }, 10, true);
        expect([rect?.x, rect?.y, rect?.width, rect?.height]).toEqual([6, 16, 108, 38]);
        expect(scrollIntoView).not.toHaveBeenCalled();
        el.getBoundingClientRect = () => new DOMRect(10, -50, 100, 30);
        UserGuideFoundation.measure({ target: el }, undefined, false);
        expect(scrollIntoView).not.toHaveBeenCalled();
        UserGuideFoundation.measure({ target: el }, undefined, true);
        expect(scrollIntoView).toHaveBeenCalledTimes(1);
        expect(UserGuideFoundation.measure({ target: () => null }, 5, true)).toBeNull();
    });

    it('isSameRect 逐项比较，空值只与空值相同', () => {
        expect(UserGuideFoundation.isSameRect(new DOMRect(1, 2, 3, 4), new DOMRect(1, 2, 3, 4))).toBe(true);
        expect(UserGuideFoundation.isSameRect(new DOMRect(1, 2, 3, 4), new DOMRect(1, 2, 3, 5))).toBe(false);
        expect(UserGuideFoundation.isSameRect(null, null)).toBe(true);
        expect(UserGuideFoundation.isSameRect(null, new DOMRect())).toBe(false);
    });
});
