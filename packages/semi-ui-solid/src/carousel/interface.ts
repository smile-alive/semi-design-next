import type { JSX, Ref } from 'solid-js';
import type { strings } from '@fibrae/semi-foundation/carousel/constants';
import type { CarouselAutoPlay } from '@fibrae/semi-foundation/carousel/foundation';
import type { ElementProps } from '../_base/element-props';

export interface CarouselHandle {
    next: () => void;
    prev: () => void;
    /** Out-of-range indexes wrap around */
    goTo: (targetIndex: number) => void;
    /** Starts autoplay, even with `autoPlay={false}` */
    play: () => void;
    stop: () => void;
}

export type CarouselElement = HTMLDivElement & CarouselHandle;

/** Native attributes of one arrow button; its content is Carousel's `leftArrow` or `rightArrow` */
export interface ArrowButton {
    props?: JSX.ButtonHTMLAttributes<HTMLButtonElement>;
}

export interface ArrowProps {
    leftArrow?: ArrowButton;
    rightArrow?: ArrowButton;
}

/**
 * Every child element is a slide and receives its classes, role and `inert` from Carousel. Focus and blur inside the
 * carousel are reported through `onFocusIn` and `onFocusOut`, since a div's own `onFocus` never sees focus moving
 * within it.
 */
export interface CarouselProps extends ElementProps<'div', 'onChange' | 'ref'> {
    /** Names the carousel region; without a name it is not a landmark */
    'aria-label'?: string;
    activeIndex?: number;
    animation?: (typeof strings.ANIMATION_MAP)[number];
    arrowProps?: ArrowProps;
    autoPlay?: CarouselAutoPlay;
    arrowType?: (typeof strings.ARROW_MAP)[number];
    children?: JSX.Element;
    class?: string;
    defaultActiveIndex?: number;
    indicatorPosition?: (typeof strings.POSITION_MAP)[number];
    indicatorSize?: (typeof strings.SIZE)[number];
    theme?: (typeof strings.THEME_MAP)[number];
    indicatorType?: (typeof strings.TYPE_MAP)[number];
    /** Replaces the icon of the previous arrow; `null` leaves the button empty */
    leftArrow?: JSX.Element;
    onChange?: (index: number, preIndex: number) => void;
    /** Replaces the icon of the next arrow; `null` leaves the button empty */
    rightArrow?: JSX.Element;
    showArrow?: boolean;
    showIndicator?: boolean;
    slideDirection?: (typeof strings.DIRECTION)[number];
    speed?: number;
    trigger?: (typeof strings.TRIGGER)[number];
    /** The root element with the CarouselHandle methods */
    ref?: Ref<CarouselElement>;
}

export interface CarouselIndicatorProps {
    activeIndex: number;
    position?: (typeof strings.POSITION_MAP)[number];
    size?: (typeof strings.SIZE)[number];
    total: number;
    theme?: (typeof strings.THEME_MAP)[number];
    type?: (typeof strings.TYPE_MAP)[number];
    onIndicatorChange: (activeIndex: number) => void;
    getTabId: (index: number) => string;
    getSlideId: (index: number) => string;
    trigger?: (typeof strings.TRIGGER)[number];
    ref?: (element: HTMLDivElement) => void;
    onKeyDown?: JSX.EventHandler<HTMLButtonElement, KeyboardEvent>;
    onBlur?: JSX.EventHandler<HTMLButtonElement, FocusEvent>;
}

export interface CarouselArrowProps {
    type?: (typeof strings.ARROW_MAP)[number];
    theme?: (typeof strings.THEME_MAP)[number];
    prev: () => void;
    next: () => void;
    arrowProps?: ArrowProps;
    leftArrow?: JSX.Element;
    rightArrow?: JSX.Element;
}
