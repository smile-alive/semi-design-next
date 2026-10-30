import { describe, expect, it, vi } from 'vite-plus/test';
import TooltipFoundation, { type TooltipAdapter, type TooltipBaseProps, type TooltipBaseState } from '../foundation';

function createFoundation(initialProps: TooltipBaseProps = {}) {
    const props: TooltipBaseProps = { trigger: 'click', ...initialProps };
    let state: TooltipBaseState = { isInsert: false, transitionState: '', triggerEventSet: {}, visible: false };
    // what the host's window mousedown listener would call
    let clickOutsideHandler: ((e: MouseEvent) => void) | undefined;
    const adapter = {
        getProp: (key: string) => props[key],
        getProps: () => props,
        getState: (key: string) => state[key],
        getStates: () => state,
        setState: (partial: Partial<TooltipBaseState>) => {
            state = { ...state, ...partial };
        },
        registerTriggerEvent: () => {},
        registerPortalEvent: () => {},
        registerClickOutsideHandler: (handler: (e: MouseEvent) => void) => {
            clickOutsideHandler = handler;
        },
        unregisterClickOutsideHandler: () => {
            clickOutsideHandler = undefined;
        },
        isEventInTrigger: () => false,
        isEventInPopup: () => false,
        notifyClickOutSide: vi.fn<(e: MouseEvent) => void>(),
        insertPortal: vi.fn<() => void>(() => adapter.setState({ isInsert: true, visible: true })),
        removePortal: vi.fn<() => void>(() => adapter.setState({ isInsert: false })),
        closePopup: vi.fn<() => void>(() => adapter.setState({ visible: false })),
        getPopupId: () => 'popup',
        getPortalContainer: (): HTMLElement | null => null,
        getTriggerNode: () => null,
        setInitialFocus: () => {},
        notifyOpen: vi.fn<() => void>(),
        isTriggerHovered: () => true,
        notifyVisibleChange: vi.fn<(visible: boolean) => void>(),
    };
    const foundation = new TooltipFoundation(adapter as unknown as TooltipAdapter);
    foundation.init();
    // the owner applies a new `visible`, as a host's prop watcher does
    const setVisible = (visible?: boolean) => {
        props.visible = visible;
        foundation.handleVisiblePropChange();
    };
    const pressOutside = () => {
        const event = new MouseEvent('mousedown');
        clickOutsideHandler?.(event);
        return event;
    };
    return { foundation, adapter, setVisible, pressOutside };
}

describe('show', () => {
    it('已经打开时再次 show 不会重复打开', () => {
        const { foundation, adapter } = createFoundation();

        foundation.show();
        foundation.show();

        expect(adapter.insertPortal).toHaveBeenCalledTimes(1);
    });

    it('hide 之后再次 show 会重新打开', () => {
        const { foundation, adapter } = createFoundation();

        foundation.show();
        foundation.hide();
        foundation.show();

        expect(adapter.insertPortal).toHaveBeenCalledTimes(2);
        expect(adapter.closePopup).toHaveBeenCalledTimes(1);
    });

    it('destroy 之后 init 重新打开不受上一次状态影响', () => {
        const { foundation, adapter } = createFoundation();

        foundation.show();
        foundation.destroy();
        foundation.init();
        foundation.show();

        // destroy() does not close the previous open by itself; the re-initialised foundation still opens fresh
        expect(adapter.insertPortal).toHaveBeenCalledTimes(2);
    });

    it('未打开时 hide 不调用 closePopup', () => {
        const { foundation, adapter } = createFoundation();

        foundation.hide();

        expect(adapter.closePopup).not.toHaveBeenCalled();
    });

    it('受控 visible 为 false 时 show 只请求打开，使用方回写后打开且不重复报告', () => {
        const { foundation, adapter, setVisible } = createFoundation({ visible: false });
        foundation.show();
        foundation.show();
        expect(adapter.insertPortal).not.toHaveBeenCalled();
        expect(adapter.notifyVisibleChange.mock.calls).toEqual([[true], [true]]);

        setVisible(true);
        foundation.handleOpened();
        expect(adapter.insertPortal).toHaveBeenCalledTimes(1);
        expect(adapter.notifyVisibleChange).toHaveBeenCalledTimes(2);
    });

    it('受控 visible 为 true 时 hide 只请求关闭，使用方回写后关闭且不重复报告', () => {
        const { foundation, adapter, setVisible } = createFoundation({ visible: true });
        foundation.handleOpened();
        expect(adapter.notifyVisibleChange).not.toHaveBeenCalled();
        foundation.hide();
        foundation.hide();
        expect(adapter.closePopup).not.toHaveBeenCalled();
        expect(adapter.notifyVisibleChange.mock.calls).toEqual([[false], [false]]);

        setVisible(false);
        expect(adapter.closePopup).toHaveBeenCalledTimes(1);
        expect(adapter.notifyVisibleChange).toHaveBeenCalledTimes(2);
    });

    it('受控时使用方自行打开和关闭都不报告', () => {
        const { foundation, adapter, setVisible } = createFoundation({ visible: false });

        setVisible(true);
        foundation.handleOpened();
        expect(adapter.insertPortal).toHaveBeenCalledTimes(1);
        setVisible(false);
        expect(adapter.closePopup).toHaveBeenCalledTimes(1);
        expect(adapter.notifyVisibleChange).not.toHaveBeenCalled();
    });

    it('使用方拒绝打开请求后自行打开再关闭，弹层照常开合且都不报告', () => {
        const { foundation, adapter, setVisible } = createFoundation({ visible: false });
        foundation.show();
        adapter.notifyVisibleChange.mockClear();

        // visible stays false while the request is rejected, so hosts never re-enter the prop handler
        setVisible(true);
        foundation.handleOpened();
        expect(adapter.insertPortal).toHaveBeenCalledTimes(1);
        setVisible(false);
        expect(adapter.closePopup).toHaveBeenCalledTimes(1);
        expect(adapter.notifyVisibleChange).not.toHaveBeenCalled();
    });

    it('非受控时 show 与 hide 直接开关并报告', () => {
        const { foundation, adapter } = createFoundation();
        foundation.show();
        foundation.handleOpened();
        foundation.hide();
        expect(adapter.insertPortal).toHaveBeenCalledTimes(1);
        expect(adapter.closePopup).toHaveBeenCalledTimes(1);
        expect(adapter.notifyVisibleChange.mock.calls).toEqual([[true], [false]]);
    });

    it('尚未打开时 hide 不发送关闭请求', () => {
        const { foundation, adapter } = createFoundation({ visible: false });
        foundation.hide();
        expect(adapter.notifyVisibleChange).not.toHaveBeenCalled();
    });
});

describe('handleClickOutside', () => {
    const openPopup = (props: TooltipBaseProps) => {
        const created = createFoundation(props);
        created.adapter.getPortalContainer = () => document.createElement('div');
        created.foundation.show();
        return created;
    };

    it.each<TooltipBaseProps>([{ trigger: 'click' }, { trigger: 'contextMenu' }, { trigger: 'hover', clickTriggerToHide: true }, { trigger: 'custom', clickTriggerToHide: true }])('%o 时在外部按下先报告再关闭', (props) => {
        const { adapter, pressOutside } = openPopup(props);
        const event = pressOutside();
        expect(adapter.notifyClickOutSide).toHaveBeenCalledWith(event);
        expect(adapter.closePopup).toHaveBeenCalledTimes(1);
        expect(adapter.notifyClickOutSide.mock.invocationCallOrder[0]).toBeLessThan(adapter.notifyVisibleChange.mock.invocationCallOrder[0]);
    });

    it('trigger 为 custom 时只报告不关闭', () => {
        const { adapter, pressOutside } = openPopup({ trigger: 'custom' });
        pressOutside();
        expect(adapter.notifyClickOutSide).toHaveBeenCalledTimes(1);
        expect(adapter.closePopup).not.toHaveBeenCalled();
    });

    it('trigger 为 hover 时不监听外部按下', () => {
        const { adapter, pressOutside } = openPopup({ trigger: 'hover' });
        pressOutside();
        expect(adapter.notifyClickOutSide).not.toHaveBeenCalled();
    });

    it.each(['isEventInTrigger', 'isEventInPopup'] as const)('%s 为 true 时不算外部', (query) => {
        const { adapter, pressOutside } = openPopup({ trigger: 'click' });
        adapter[query] = () => true;
        pressOutside();
        expect(adapter.notifyClickOutSide).not.toHaveBeenCalled();
        expect(adapter.closePopup).not.toHaveBeenCalled();
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
        const { foundation, adapter } = createFoundation({ trigger: 'hover' });
        adapter.isTriggerHovered = () => false;
        foundation.show();
        foundation.handleOpened();
        trigger.remove();
        expect(adapter.closePopup).toHaveBeenCalledTimes(kept ? 0 : 1);
    });
});
