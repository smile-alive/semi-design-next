import type { Snippet } from 'svelte';
import type { HTMLAttributes, HTMLButtonAttributes } from 'svelte/elements';
import type { CarouselAutoPlay } from '@fibrae/semi-foundation/carousel/foundation';

/** Data for one arrow button; `onclick` and `class` merge with the built-in handler and classes */
export interface ArrowButton {
    props?: HTMLButtonAttributes;
}

export interface ArrowProps {
    leftArrow?: ArrowButton;
    rightArrow?: ArrowButton;
}

export interface CarouselSlideContext<T> {
    item: T;
    index: number;
}

// The mouse and focus listeners are called by the component itself, so the root's own are not spread
export interface CarouselProps<T = unknown> extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** One slide per item; the slides are rendered by `slide`, which is how the count is known before the first render */
    items: readonly T[];
    /** Controlled index; `undefined` hands control back, continuing from the last controlled index */
    activeIndex?: number;
    animation?: 'slide' | 'fade';
    arrowProps?: ArrowProps;
    arrowType?: 'always' | 'hover';
    autoPlay?: CarouselAutoPlay;
    indicatorPosition?: 'left' | 'center' | 'right';
    indicatorSize?: 'small' | 'medium';
    indicatorType?: 'dot' | 'line' | 'columnar';
    showArrow?: boolean;
    showIndicator?: boolean;
    slideDirection?: 'left' | 'right';
    speed?: number;
    theme?: 'dark' | 'primary' | 'light';
    trigger?: 'click' | 'hover';
    onChange?: (activeIndex: number, preIndex: number) => void;
    /** The content of one slide; the carousel wraps it in the element that carries the slide's classes, role and `inert` */
    slide: Snippet<[CarouselSlideContext<T>]>;
    /** Replaces the icon of the previous arrow */
    leftArrow?: Snippet;
    /** Replaces the icon of the next arrow */
    rightArrow?: Snippet;
}

export interface CarouselState {
    activeIndex: number;
    preIndex: number;
    isReverse: boolean;
    isInit: boolean;
    rotating: boolean;
}
