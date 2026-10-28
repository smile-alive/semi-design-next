import type { DragPointerEvent } from '@fibrae/semi-foundation/color-picker/interface';

// The foundation types currentTarget as Element, while the native PointerEvent has EventTarget | null.
// Vue calls the listener synchronously, so currentTarget is still set and can capture the pointer.
export function toDragEvent(event: PointerEvent): DragPointerEvent {
    return {
        button: event.button,
        clientX: event.clientX,
        clientY: event.clientY,
        currentTarget: event.currentTarget as Element,
        pointerId: event.pointerId,
    };
}
