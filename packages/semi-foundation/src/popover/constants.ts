import { BASE_CLASS_PREFIX } from '../base/constants';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-popover`,
    ARROW: `${BASE_CLASS_PREFIX}-popover-icon-arrow`,
};

export const strings = {
    POSITION_SET: ['top', 'topLeft', 'topRight', 'left', 'leftTop', 'leftBottom', 'right', 'rightTop', 'rightBottom', 'bottom', 'bottomLeft', 'bottomRight', 'leftTopOver', 'rightTopOver'],
    TRIGGER_SET: ['hover', 'focus', 'click', 'custom', 'contextMenu'],
} as const;

export const numbers = {
    SPACING: 4,
    SPACING_WITH_ARROW: 10,
};

/** Triggers that open an interactive card are announced as a dialog; hover and focus ones as a tooltip */
export function getPopoverRole(role: string | undefined, trigger: string) {
    return role ?? (['click', 'custom', 'contextMenu'].includes(trigger) ? 'dialog' : 'tooltip');
}

export function getPopoverSpacing(spacing?: number | { x: number; y: number }, showArrow?: boolean) {
    return spacing ?? (showArrow ? numbers.SPACING_WITH_ARROW : numbers.SPACING);
}
