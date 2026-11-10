import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import TooltipFoundation, { type TooltipAdapter, type TooltipBaseProps, type TooltipBaseState } from '../foundation';

const created: TooltipFoundation[] = [];

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    for (const foundation of created.splice(0)) {
        foundation.destroy();
    }
    document.body.replaceChildren();
    vi.useRealTimers();
});

function createFoundation(initialProps: TooltipBaseProps = {}) {
    const props: TooltipBaseProps = { trigger: 'click', ...initialProps };
    // in the document: the focus checks read the active element of the popup's tree
    const popup = document.createElement('div');
    document.body.append(popup);
    let state = TooltipFoundation.getInitialState();
    let clickOutsideHandler: ((e: MouseEvent) => void) | undefined;
    let animations: Promise<void> | null = null;
    const adapter = {
        getProp: (key: string) => props[key],
        getProps: () => props,
        getState: (key: string) => state[key],
        getStates: () => state,
        setState: vi.fn<(partial: Partial<TooltipBaseState>) => void>((partial) => {
            state = { ...state, ...partial };
        }),
        registerClickOutsideHandler: (handler: (e: MouseEvent) => void) => {
            clickOutsideHandler = handler;
        },
        unregisterClickOutsideHandler: () => {
            clickOutsideHandler = undefined;
        },
        isEventInTrigger: () => false,
        isEventInPopup: () => false,
        notifyClickOutSide: vi.fn<(e: MouseEvent) => void>(),
        insertPortal: vi.fn<TooltipAdapter['insertPortal']>(() => ({ portalTarget: null, colorScheme: undefined })),
        removePortal: vi.fn<() => void>(),
        showPopover: vi.fn<() => void>(),
        hidePopover: vi.fn<() => void>(),
        waitAnimations: () => animations,
        notifyAfterOpen: vi.fn<() => void>(),
        notifyAfterClose: vi.fn<() => void>(),
        getPopupId: () => 'popup',
        getPortalContainer: (): HTMLElement | null => popup,
        getTriggerNode: () => null,
        getTriggerRect: () => null,
        getTriggerElement: () => null,
        observeTrigger: () => {},
        unobserveTrigger: () => {},
        setInitialFocus: () => {},
        notifyOpen: vi.fn<() => void>(),
        isTriggerHovered: () => true,
        notifyVisibleChange: vi.fn<(visible: boolean) => void>(),
    };
    const foundation = new TooltipFoundation(adapter as unknown as TooltipAdapter);
    created.push(foundation);
    foundation.init();
    const setVisible = (visible?: boolean) => {
        const prev = { ...props };
        props.visible = visible;
        foundation.handlePropsChange(prev);
    };
    const pressOutside = () => {
        const event = new MouseEvent('mousedown');
        clickOutsideHandler?.(event);
        return event;
    };
    // the host's commit: syncs the new phase, and the opening's hover check runs a task later
    const commit = () => {
        foundation.syncPopup();
        vi.advanceTimersByTime(0);
    };
    // the next waitAnimations() hands out a promise the test settles
    const animate = () => {
        const { promise, resolve } = Promise.withResolvers<void>();
        animations = promise;
        return async () => {
            animations = null;
            resolve();
            await promise;
        };
    };
    // closing marks the popup as leaving
    const closes = () => adapter.setState.mock.calls.filter(([partial]) => partial.transitionState === 'leave').length;
    const getState = () => state;
    return { foundation, adapter, setVisible, pressOutside, commit, animate, closes, getState };
}

describe('show', () => {
    it('已经打开时再次 show 不会重复打开', () => {
        const { foundation, adapter } = createFoundation();

        foundation.show();
        foundation.show();

        expect(adapter.insertPortal).toHaveBeenCalledTimes(1);
    });

    it('hide 之后再次 show 会重新打开', () => {
        const { foundation, adapter, closes } = createFoundation();

        foundation.show();
        foundation.hide();
        foundation.show();

        expect(adapter.insertPortal).toHaveBeenCalledTimes(2);
        expect(closes()).toBe(1);
    });

    it('destroy 与 init 之间保持打开：不重复打开，点击外部仍能关闭', () => {
        const { foundation, adapter, pressOutside, commit, closes } = createFoundation();

        foundation.show();
        commit();
        foundation.destroy();
        expect(closes()).toBe(0);
        foundation.init();
        foundation.show();
        commit();
        expect(adapter.insertPortal).toHaveBeenCalledTimes(1);
        expect(adapter.notifyOpen).toHaveBeenCalledTimes(1);
        expect(adapter.notifyVisibleChange.mock.calls).toEqual([[true]]);

        pressOutside();
        expect(closes()).toBe(1);
    });

    it('受控 visible 为 false 时 show 只请求打开，使用方回写后打开且不重复报告', () => {
        const { foundation, adapter, setVisible, commit } = createFoundation({ visible: false });
        foundation.show();
        foundation.show();
        expect(adapter.insertPortal).not.toHaveBeenCalled();
        expect(adapter.notifyVisibleChange.mock.calls).toEqual([[true], [true]]);

        setVisible(true);
        commit();
        expect(adapter.insertPortal).toHaveBeenCalledTimes(1);
        expect(adapter.notifyVisibleChange).toHaveBeenCalledTimes(2);
    });

    it('受控 visible 为 true 时 hide 只请求关闭，使用方回写后关闭且不重复报告', () => {
        const { foundation, adapter, setVisible, commit, closes } = createFoundation({ visible: true });
        commit();
        expect(adapter.notifyVisibleChange).not.toHaveBeenCalled();
        foundation.hide();
        foundation.hide();
        expect(closes()).toBe(0);
        expect(adapter.notifyVisibleChange.mock.calls).toEqual([[false], [false]]);

        setVisible(false);
        expect(closes()).toBe(1);
        expect(adapter.notifyVisibleChange).toHaveBeenCalledTimes(2);
    });

    it('受控时使用方自行打开和关闭都不报告', () => {
        const { adapter, setVisible, commit, closes } = createFoundation({ visible: false });

        setVisible(true);
        commit();
        expect(adapter.insertPortal).toHaveBeenCalledTimes(1);
        setVisible(false);
        expect(closes()).toBe(1);
        expect(adapter.notifyVisibleChange).not.toHaveBeenCalled();
    });

    it('使用方拒绝打开请求后自行打开再关闭，弹层照常开合且都不报告', () => {
        const { foundation, adapter, setVisible, commit, closes } = createFoundation({ visible: false });
        foundation.show();
        adapter.notifyVisibleChange.mockClear();

        // visible stays false while the request is rejected, so hosts never re-enter the prop handler
        setVisible(true);
        commit();
        expect(adapter.insertPortal).toHaveBeenCalledTimes(1);
        setVisible(false);
        expect(closes()).toBe(1);
        expect(adapter.notifyVisibleChange).not.toHaveBeenCalled();
    });

    it('非受控时 show 与 hide 直接开关并报告', () => {
        const { foundation, adapter, commit, closes } = createFoundation();
        foundation.show();
        commit();
        foundation.hide();
        expect(adapter.insertPortal).toHaveBeenCalledTimes(1);
        expect(closes()).toBe(1);
        expect(adapter.notifyVisibleChange.mock.calls).toEqual([[true], [false]]);
    });

    it.each<TooltipBaseProps>([{}, { visible: false }])('尚未打开时 hide 不关闭弹层也不发送关闭请求：%o', (props) => {
        const { foundation, adapter, closes } = createFoundation(props);
        foundation.hide();
        expect(closes()).toBe(0);
        expect(adapter.notifyVisibleChange).not.toHaveBeenCalled();
    });
});

describe('syncPopup', () => {
    it('进场：showPopover 之后，进场动画结束时报告一次 afterOpen', async () => {
        const { foundation, adapter, commit, animate } = createFoundation();
        foundation.show();
        const finish = animate();
        commit();
        expect(adapter.showPopover).toHaveBeenCalledTimes(1);
        expect(adapter.notifyAfterOpen).not.toHaveBeenCalled();

        await finish();
        commit();
        expect(adapter.notifyAfterOpen).toHaveBeenCalledTimes(1);
    });

    it('悬停打开时指针已离开，弹层收回且不报告 afterOpen', () => {
        const { foundation, adapter, commit, closes } = createFoundation({ trigger: 'hover' });
        adapter.isTriggerHovered = () => false;
        foundation.show();
        commit();
        expect(closes()).toBe(1);
        expect(adapter.notifyOpen).not.toHaveBeenCalled();
        expect(adapter.notifyAfterOpen).not.toHaveBeenCalled();
    });

    it('离场：动画结束后 hidePopover、卸载弹层并报告 afterClose', async () => {
        const { foundation, adapter, commit, animate, getState } = createFoundation();
        foundation.show();
        commit();
        foundation.hide();
        const finish = animate();
        commit();
        expect(adapter.hidePopover).not.toHaveBeenCalled();

        await finish();
        expect(adapter.hidePopover).toHaveBeenCalledTimes(1);
        expect(adapter.removePortal).toHaveBeenCalledTimes(1);
        expect(getState().isInsert).toBe(false);
        expect(adapter.notifyAfterClose).toHaveBeenCalledTimes(1);
    });

    it('keepDOM 时离场后保留弹层', () => {
        const { foundation, adapter, commit, getState } = createFoundation({ keepDOM: true });
        foundation.show();
        commit();
        foundation.hide();
        commit();
        expect(adapter.hidePopover).toHaveBeenCalledTimes(1);
        expect(adapter.removePortal).not.toHaveBeenCalled();
        expect(getState().isInsert).toBe(true);
        expect(adapter.notifyAfterClose).toHaveBeenCalledTimes(1);
    });

    it('离场中重新打开：旧的离场作废，重新打开时报告一次 afterClose', async () => {
        const { foundation, adapter, commit, animate } = createFoundation();
        foundation.show();
        commit();
        foundation.hide();
        const finish = animate();
        commit();
        foundation.show();
        expect(adapter.notifyAfterClose).toHaveBeenCalledTimes(1);
        commit();
        await finish();
        expect(adapter.hidePopover).not.toHaveBeenCalled();
        expect(adapter.notifyAfterClose).toHaveBeenCalledTimes(1);
        // the reopening is an opening of its own
        expect(adapter.notifyAfterOpen).toHaveBeenCalledTimes(2);
    });

    it('destroy 作废等待中的动画', async () => {
        const { foundation, adapter, commit, animate } = createFoundation();
        foundation.show();
        const finish = animate();
        commit();
        foundation.destroy();
        await finish();
        expect(adapter.notifyAfterOpen).not.toHaveBeenCalled();
    });

    it('handleUnmount 补报一次尚未报告的 afterClose', () => {
        const { foundation, adapter, commit } = createFoundation();
        foundation.handleUnmount();
        expect(adapter.notifyAfterClose).not.toHaveBeenCalled();

        foundation.show();
        commit();
        foundation.handleUnmount();
        foundation.handleUnmount();
        expect(adapter.notifyAfterClose).toHaveBeenCalledTimes(1);
    });
});

describe('handleClickOutside', () => {
    const openPopup = (props: TooltipBaseProps) => {
        const opened = createFoundation(props);
        opened.foundation.show();
        return opened;
    };

    it.each<TooltipBaseProps>([{ trigger: 'click' }, { trigger: 'contextMenu' }, { trigger: 'hover', clickTriggerToHide: true }, { trigger: 'custom', clickTriggerToHide: true }])('%o 时在外部按下先报告再关闭', (props) => {
        const { adapter, pressOutside, closes } = openPopup(props);
        const event = pressOutside();
        expect(adapter.notifyClickOutSide).toHaveBeenCalledWith(event);
        expect(closes()).toBe(1);
        expect(adapter.notifyClickOutSide.mock.invocationCallOrder[0]).toBeLessThan(adapter.notifyVisibleChange.mock.invocationCallOrder[0]);
    });

    it('trigger 为 custom 时只报告不关闭', () => {
        const { adapter, pressOutside, closes } = openPopup({ trigger: 'custom' });
        pressOutside();
        expect(adapter.notifyClickOutSide).toHaveBeenCalledTimes(1);
        expect(closes()).toBe(0);
    });

    it('trigger 为 hover 时不监听外部按下', () => {
        const { adapter, pressOutside } = openPopup({ trigger: 'hover' });
        pressOutside();
        expect(adapter.notifyClickOutSide).not.toHaveBeenCalled();
    });

    it.each(['isEventInTrigger', 'isEventInPopup'] as const)('%s 为 true 时不算外部', (query) => {
        const { adapter, pressOutside, closes } = openPopup({ trigger: 'click' });
        adapter[query] = () => true;
        pressOutside();
        expect(adapter.notifyClickOutSide).not.toHaveBeenCalled();
        expect(closes()).toBe(0);
    });

    it('弹层不在文档中时不算外部', () => {
        const { adapter, pressOutside } = openPopup({ trigger: 'click' });
        adapter.getPortalContainer = () => null;
        pressOutside();
        expect(adapter.notifyClickOutSide).not.toHaveBeenCalled();
    });

    it('关闭后解除监听', () => {
        const { foundation, adapter, pressOutside } = openPopup({ trigger: 'click' });
        foundation.hide();
        pressOutside();
        expect(adapter.notifyClickOutSide).not.toHaveBeenCalled();
    });
});

describe('handleOpened', () => {
    it.each([
        ['outer popup', true],
        ['popup outer', true],
        ['popups', false],
    ])('焦点在 data-popupid="%s" 的触发器上时，悬停已离开的弹层保持打开：%s', (popupIds, kept) => {
        const trigger = document.createElement('button');
        trigger.dataset.popupid = popupIds;
        document.body.append(trigger);
        trigger.focus();
        const { foundation, adapter, commit, closes } = createFoundation({ trigger: 'hover' });
        adapter.isTriggerHovered = () => false;
        foundation.show();
        commit();
        trigger.remove();
        expect(closes()).toBe(kept ? 0 : 1);
    });
});
