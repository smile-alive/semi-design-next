import type { HTMLAttributes, StyleValue, VNode } from 'vue';
import type { ButtonProps } from '../button/interface';
import type { Position } from '../tooltip/interface';

/** A host element, or a function that finds it when the step is measured; it may return nothing while it is absent. */
export type UserGuideTarget = Element | (() => Element | null | undefined);

/** Props and listeners of the previous and next buttons; the button text comes from `#prevText` and `#nextText`. */
export interface UserGuideButtonProps extends ButtonProps {
    class?: HTMLAttributes['class'];
    style?: StyleValue;
    /** Called before the built-in previous, next or finish handling, which still runs. */
    onClick?: (event: MouseEvent) => void;
}

export interface UserGuideStepItem {
    class?: HTMLAttributes['class'];
    target?: UserGuideTarget;
    /** Text of the title; the `#title` slot wins when it renders content. */
    title?: string;
    /** Text of the description; the `#description` slot wins when it renders content. */
    description?: string;
    mask?: boolean;
    /** Only applies to the popup mode. */
    showArrow?: boolean;
    spotlightPadding?: number;
    theme?: 'default' | 'primary';
    position?: Position;
}

export interface UserGuideProps {
    /** Controlled step index; undefined lets the component keep it. */
    current?: number;
    finishText?: string;
    getPopupContainer?: () => HTMLElement;
    mask?: boolean;
    mode?: 'popup' | 'modal';
    nextButtonProps?: UserGuideButtonProps;
    position?: Position;
    prevButtonProps?: UserGuideButtonProps;
    showPrevButton?: boolean;
    showSkipButton?: boolean;
    spotlightPadding?: number;
    steps?: UserGuideStepItem[];
    theme?: 'default' | 'primary';
    visible?: boolean;
    zIndex?: number;
}

export interface UserGuideEmits {
    /** `update:current` comes first, then `change`. */
    'update:current': [current: number];
    /** Skip button and Escape: `update:visible` comes first, then `skip`. Finish emits it before `finish` as well. */
    'update:visible': [visible: false];
    change: [current: number];
    next: [current: number];
    prev: [current: number];
    skip: [];
    finish: [];
}

export interface UserGuideStepSlotProps {
    item: UserGuideStepItem;
    index: number;
}

export interface UserGuideSlots {
    /** Empty content falls back to `item.title`. */
    title?: (props: UserGuideStepSlotProps) => VNode[];
    /** Empty content falls back to `item.description`. */
    description?: (props: UserGuideStepSlotProps) => VNode[];
    /** Without content the step has no cover area. */
    cover?: (props: UserGuideStepSlotProps) => VNode[];
    /** Text of the next button except on the last step, which shows `finishText`. */
    nextText?: () => VNode[];
    prevText?: () => VNode[];
}

export interface UserGuideState {
    current: number;
    spotlightRect: DOMRect | null;
}
