import { mergeProps, type VNode } from 'vue';
import slotNodes, { isSlotContent, type KeyedNode } from '../_base/slot-nodes';
import type { UserGuideButtonProps } from './interface';

// A false v-if leaves a comment and template whitespace an empty text: neither is content. Call once per render so a
// scoped slot is not evaluated twice.
export function contentNodes<A>(slot: ((args: A) => VNode[]) | undefined, args: A): KeyedNode[] {
    return slot ? slotNodes(slot(args)).filter(isSlotContent) : [];
}

export function buttonBind(base: UserGuideButtonProps, custom: UserGuideButtonProps | undefined, builtIn: () => void) {
    const { onClick, ...rest } = custom ?? {};
    return mergeProps({ ...base }, rest, {
        onClick: (event: MouseEvent) => {
            onClick?.(event);
            builtIn();
        },
    });
}

export function anchorStyle(rect: DOMRect) {
    return {
        position: 'fixed',
        left: `${rect.x}px`,
        top: `${rect.y}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        pointerEvents: 'none',
    } as const;
}
