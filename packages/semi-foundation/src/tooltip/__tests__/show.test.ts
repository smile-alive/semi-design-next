import { describe, expect, it, vi } from 'vite-plus/test';
import TooltipFoundation, { type TooltipAdapter, type TooltipBaseProps, type TooltipBaseState } from '../foundation';

function createFoundation(initialProps: TooltipBaseProps = {}) {
    const props: TooltipBaseProps = { trigger: 'click', ...initialProps };
    let state = TooltipFoundation.getInitialState();
    let clickOutsideHandler: ((e: MouseEvent) => void) | undefined;
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
        insertPortal: vi.fn<() => void>(() => adapter.setState({ isInsert: true, transitionState: 'enter', visible: true })),
        removePortal: vi.fn<() => void>(() => adapter.setState({ isInsert: false, transitionState: '' })),
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
    // closing marks the popup as leaving
    const closes = () => adapter.setState.mock.calls.filter(([partial]) => partial.transitionState === 'leave').length;
    return { foundation, adapter, setVisible, pressOutside, closes };
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
        const { foundation, adapter, pressOutside, closes } = createFoundation();
        adapter.getPortalContainer = () => document.createElement('div');

        foundation.show();
        foundation.handleOpened();
        foundation.destroy();
        expect(closes()).toBe(0);
        foundation.init();
        foundation.show();
        foundation.handleOpened();
        expect(adapter.insertPortal).toHaveBeenCalledTimes(1);
        expect(adapter.notifyOpen).toHaveBeenCalledTimes(1);
        expect(adapter.notifyVisibleChange.mock.calls).toEqual([[true]]);

        pressOutside();
        expect(closes()).toBe(1);
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
        const { foundation, adapter, setVisible, closes } = createFoundation({ visible: true });
        foundation.handleOpened();
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
        const { foundation, adapter, setVisible, closes } = createFoundation({ visible: false });

        setVisible(true);
        foundation.handleOpened();
        expect(adapter.insertPortal).toHaveBeenCalledTimes(1);
        setVisible(false);
        expect(closes()).toBe(1);
        expect(adapter.notifyVisibleChange).not.toHaveBeenCalled();
    });

    it('使用方拒绝打开请求后自行打开再关闭，弹层照常开合且都不报告', () => {
        const { foundation, adapter, setVisible, closes } = createFoundation({ visible: false });
        foundation.show();
        adapter.notifyVisibleChange.mockClear();

        // visible stays false while the request is rejected, so hosts never re-enter the prop handler
        setVisible(true);
        foundation.handleOpened();
        expect(adapter.insertPortal).toHaveBeenCalledTimes(1);
        setVisible(false);
        expect(closes()).toBe(1);
        expect(adapter.notifyVisibleChange).not.toHaveBeenCalled();
    });

    it('非受控时 show 与 hide 直接开关并报告', () => {
        const { foundation, adapter, closes } = createFoundation();
        foundation.show();
        foundation.handleOpened();
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

describe('handleClickOutside', () => {
    const openPopup = (props: TooltipBaseProps) => {
        const created = createFoundation(props);
        created.adapter.getPortalContainer = () => document.createElement('div');
        created.foundation.show();
        return created;
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
        const { foundation, adapter, closes } = createFoundation({ trigger: 'hover' });
        adapter.isTriggerHovered = () => false;
        foundation.show();
        foundation.handleOpened();
        trigger.remove();
        expect(closes()).toBe(kept ? 0 : 1);
    });
});
