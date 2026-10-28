import { describe, expect, it, vi } from 'vite-plus/test';
import DragMoveFoundation, { type DragMoveBaseProps } from '../foundation';

function setup(props: DragMoveBaseProps = {}) {
    const adapter = {
        getProp: (key: keyof DragMoveBaseProps) => props[key],
        getProps: () => props,
        notifyMouseDown: vi.fn<(e: PointerEvent) => void>(),
        notifyTouchStart: vi.fn<(e: PointerEvent) => void>(),
    };
    const foundation = new DragMoveFoundation(adapter as never);
    const element = document.createElement('div');
    const press = (init: { pointerType: string; button: number }, target: Node = element) => foundation.handlePointerDown({ pointerId: 1, clientX: 0, clientY: 0, ...init, currentTarget: element, target } as unknown as Event);
    return { foundation, adapter, element, press };
}

describe('DragMoveFoundation 按下', () => {
    it.each([
        ['mouse', 1],
        ['mouse', 2],
        ['pen', 2],
        ['pen', 5],
    ])('%s 的非主键 %i 不开始拖拽', (pointerType, button) => {
        const { foundation, adapter, press } = setup();
        press({ pointerType, button });
        expect(adapter.notifyMouseDown).not.toHaveBeenCalled();
        foundation.destroy();
    });

    it.each(['mouse', 'pen'])('%s 的主键开始拖拽', (pointerType) => {
        const { foundation, adapter, press } = setup();
        press({ pointerType, button: 0 });
        expect(adapter.notifyMouseDown).toHaveBeenCalledTimes(1);
        foundation.destroy();
    });

    it('按下点在 handler 之外不开始拖拽', () => {
        const handle = document.createElement('span');
        const { foundation, adapter, press } = setup({ handler: () => handle });
        press({ pointerType: 'mouse', button: 0 });
        expect(adapter.notifyMouseDown).not.toHaveBeenCalled();
        press({ pointerType: 'mouse', button: 0 }, handle);
        expect(adapter.notifyMouseDown).toHaveBeenCalledTimes(1);
        foundation.destroy();
    });
});
