import type { Attachment } from 'svelte/attachments';
import DragMoveFoundation, { type DragMoveAdapter, type DragMoveBaseProps } from '@fibrae/semi-foundation/drag-move/foundation';
import type { DragMoveOptions } from './interface.js';

/**
 * Makes the element it is attached to draggable (`<div {@attach dragMove(options)}>`). An attachment rather than a
 * wrapper component: a snippet cannot reach the top-level element of its content, while Svelte hands an attachment its
 * element and runs the cleanup on removal. The attachment writes `position`, `top`, `left`, `cursor` and `touch-action`
 * inline, so give the element `style:` directives rather than a reactive `style` attribute, which would rewrite them.
 * The options are read when the attachment runs; a new options object re-runs it, which also ends a drag in progress.
 */
export default function dragMove(options: DragMoveOptions = {}): Attachment<HTMLElement> {
    return (element) => {
        const { handler, onMouseDown, onMouseMove, onMouseUp, onTouchStart, onTouchMove, onTouchEnd, onTouchCancel, ...rest } = options;
        const props: DragMoveBaseProps = { ...rest, handler: typeof handler === 'object' ? () => handler : handler };
        // the foundation reads neither state nor context
        const adapter: DragMoveAdapter = {
            getContext: () => undefined as never,
            getContexts: () => ({}),
            getProp: (key) => props[key],
            getProps: () => props,
            getState: () => undefined as never,
            getStates: () => ({}),
            setState: () => {},
            notifyMouseDown: (e) => onMouseDown?.(e),
            notifyMouseMove: (e) => onMouseMove?.(e),
            notifyMouseUp: (e) => onMouseUp?.(e),
            notifyTouchStart: (e) => onTouchStart?.(e),
            notifyTouchMove: (e) => onTouchMove?.(e),
            notifyTouchEnd: (e) => onTouchEnd?.(e),
            notifyTouchCancel: (e) => onTouchCancel?.(e),
        };
        const foundation = new DragMoveFoundation(adapter);
        foundation.connect();
        foundation.init();
        element.addEventListener('pointerdown', foundation.handlePointerDown);
        foundation.prepareElements([element]);
        return () => {
            element.removeEventListener('pointerdown', foundation.handlePointerDown);
            foundation.destroy();
            foundation.disconnect();
        };
    };
}
