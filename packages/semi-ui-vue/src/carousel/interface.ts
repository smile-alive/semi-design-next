import type { ButtonHTMLAttributes, VNode } from 'vue';
import type { CarouselAutoPlay } from '@fibrae/semi-foundation/carousel/foundation';

/** Data for one arrow button; `onClick` and `class` merge with the built-in handler and classes */
export interface ArrowButton {
    props?: ButtonHTMLAttributes;
}

export interface ArrowProps {
    leftArrow?: ArrowButton;
    rightArrow?: ArrowButton;
}

export interface CarouselProps {
    /** Controlled index; `undefined` hands control back, continuing from the last controlled index */
    activeIndex?: number;
    animation?: 'slide' | 'fade';
    arrowProps?: ArrowProps;
    arrowType?: 'always' | 'hover';
    autoPlay?: CarouselAutoPlay;
    defaultActiveIndex?: number;
    indicatorPosition?: 'left' | 'center' | 'right';
    indicatorSize?: 'small' | 'medium';
    indicatorType?: 'dot' | 'line' | 'columnar';
    showArrow?: boolean;
    showIndicator?: boolean;
    slideDirection?: 'left' | 'right';
    speed?: number;
    theme?: 'dark' | 'primary' | 'light';
    trigger?: 'click' | 'hover';
}

export interface CarouselSlots {
    /** The slides: every direct child is one slide and must pass `id`, `role`, `inert`, `class` and `style` to its DOM */
    default?: () => VNode[];
    /** Replaces the icon of the previous arrow; an empty slot leaves the button empty */
    leftArrow?: () => VNode[];
    /** Replaces the icon of the next arrow; an empty slot leaves the button empty */
    rightArrow?: () => VNode[];
}

export interface CarouselEmits {
    'update:activeIndex': [index: number];
    change: [index: number, preIndex: number];
}

export interface CarouselHandle {
    next: () => void;
    prev: () => void;
    /** Out-of-range indexes wrap around */
    goTo: (targetIndex: number) => void;
    /** Starts autoplay, even with `autoPlay` off */
    play: () => void;
    stop: () => void;
}

export interface CarouselState {
    activeIndex: number;
    preIndex: number;
    isReverse: boolean;
    isInit: boolean;
    rotating: boolean;
}
