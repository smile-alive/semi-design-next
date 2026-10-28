import React, { type ReactNode } from 'react';
import type { strings } from '@fibrae/semi-foundation/carousel/constants';
import type { CarouselAutoPlay } from '@fibrae/semi-foundation/carousel/foundation';
import type { ElementProps } from '../_base/base';

export interface CarouselHandle {
    next: () => void;
    prev: () => void;
    /** Out-of-range indexes wrap around */
    goTo: (targetIndex: number) => void;
    /** Starts autoplay, even with `autoPlay={false}` */
    play: () => void;
    stop: () => void;
}

export interface CarouselProps extends ElementProps<'div', 'onChange'> {
    /** Names the carousel region; without a name it is not a landmark */
    'aria-label'?: string;
    activeIndex?: number;
    animation?: (typeof strings.ANIMATION_MAP)[number];
    arrowProps?: ArrowProps;
    autoPlay?: CarouselAutoPlay;
    arrowType?: (typeof strings.ARROW_MAP)[number];
    children?: ReactNode | Array<ReactNode>;
    className?: string;
    defaultActiveIndex?: number;
    indicatorPosition?: (typeof strings.POSITION_MAP)[number];
    indicatorSize?: (typeof strings.SIZE)[number];
    theme?: (typeof strings.THEME_MAP)[number];
    indicatorType?: (typeof strings.TYPE_MAP)[number];
    onChange?: (index: number, preIndex: number) => void;
    showArrow?: boolean;
    showIndicator?: boolean;
    slideDirection?: (typeof strings.DIRECTION)[number];
    speed?: number;
    style?: React.CSSProperties;
    trigger?: (typeof strings.TRIGGER)[number];
    /** Exposes the play, stop, goTo, prev and next methods */
    ref?: React.Ref<CarouselHandle>;
}

export interface CarouselIndicatorProps {
    activeIndex?: number;
    className?: string;
    defaultActiveIndex?: number;
    position?: (typeof strings.POSITION_MAP)[number];
    size?: (typeof strings.SIZE)[number];
    total?: number;
    theme?: (typeof strings.THEME_MAP)[number];
    type?: (typeof strings.TYPE_MAP)[number];
    onIndicatorChange?: (activeIndex: number) => void;
    getTabId: (index: number) => string;
    getSlideId: (index: number) => string;
    style?: React.CSSProperties;
    trigger?: (typeof strings.TRIGGER)[number];
    ref?: React.Ref<HTMLDivElement>;
    onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>;
    onBlur?: React.FocusEventHandler<HTMLButtonElement>;
}

export interface CarouselArrowProps {
    type?: (typeof strings.ARROW_MAP)[number];
    theme?: (typeof strings.THEME_MAP)[number];
    prev?: () => void;
    next?: () => void;
    arrowProps?: ArrowProps;
}

export interface ArrowButton {
    props?: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
    children?: React.ReactNode;
}
export interface ArrowProps {
    leftArrow?: ArrowButton;
    rightArrow?: ArrowButton;
}
