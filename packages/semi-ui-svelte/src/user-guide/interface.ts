import type { Snippet } from 'svelte';
import type { ButtonProps } from '../button/index.js';
import type { Position } from '../tooltip/index.js';

/** A host element, or a function that finds it when the step is measured; it may return nothing while it is absent. */
export type UserGuideTarget = Element | (() => Element | null | undefined);

/** Props of the previous and next buttons; the button text comes from the `prevText` and `nextText` snippets. */
export type UserGuideButtonProps = Omit<ButtonProps, 'children' | 'icon'>;

export interface UserGuideStepSnippetProps {
    item: UserGuideStepItem;
    index: number;
}

/** A step holds data only. Text or a snippet for its title, description and cover lives on the step itself. */
export interface UserGuideStepItem {
    class?: string;
    target?: UserGuideTarget;
    title?: string | Snippet<[UserGuideStepSnippetProps]>;
    description?: string | Snippet<[UserGuideStepSnippetProps]>;
    /** Without a cover the step has no cover area. */
    cover?: Snippet<[UserGuideStepSnippetProps]>;
    mask?: boolean;
    /** Only applies to the popup mode. */
    showArrow?: boolean;
    spotlightPadding?: number;
    theme?: 'default' | 'primary';
    position?: Position;
}

// No element props: UserGuide has no root DOM, so undeclared props are dropped (F11)
export interface UserGuideProps {
    /** On the Popover card or the Modal's outer element */
    class?: string;
    /** On the Popover card or the Modal's outer element */
    style?: string;
    /** Bindable. Undefined lets the component keep it; a bound or function-bound value makes the guide follow it. */
    current?: number;
    finishText?: string;
    getPopupContainer?: () => HTMLElement;
    mask?: boolean;
    mode?: 'popup' | 'modal';
    /** `onclick` runs before the built-in next or finish handling, which still runs. */
    nextButtonProps?: UserGuideButtonProps;
    position?: Position;
    prevButtonProps?: UserGuideButtonProps;
    showPrevButton?: boolean;
    showSkipButton?: boolean;
    spotlightPadding?: number;
    steps?: UserGuideStepItem[];
    theme?: 'default' | 'primary';
    /** Bindable. Skip, Escape and finish write `false`. */
    visible?: boolean;
    zIndex?: number;
    /** The new step index, after `current` was written. */
    onChange?: (current: number) => void;
    onNext?: (current: number) => void;
    onPrev?: (current: number) => void;
    /** Skip button and Escape, after `visible` was written. */
    onSkip?: () => void;
    /** After `visible` was written. */
    onFinish?: () => void;
    /** Text of the next button except on the last step, which shows `finishText`. */
    nextText?: Snippet;
    prevText?: Snippet;
}

export interface UserGuideState {
    current: number;
    spotlightRect: DOMRect | null;
}
