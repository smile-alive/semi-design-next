import type React from 'react';
import { cloneElement, isValidElement, useEffect, useId, useImperativeHandle, useRef } from 'react';
import clsx from 'clsx';
import { cssClasses, numbers } from '@fibrae/semi-foundation/carousel/constants';
import CarouselFoundation, { type CarouselAdapter } from '@fibrae/semi-foundation/carousel/foundation';
import '@fibrae/semi-foundation/carousel/carousel.scss';
import flattenChildren from '../_base/flatten-children';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';
import { useConfigContext } from '../config-provider/context';
import useLocale from '../locale/use-locale';
import CarouselArrow from './carousel-arrow';
import CarouselIndicator from './carousel-indicator';
import type { CarouselProps } from './interface';

export type { CarouselHandle } from './interface';

export interface CarouselState {
    activeIndex: number;
    preIndex: number;
    isReverse: boolean;
    isInit: boolean;
    rotating: boolean;
}

const defaultProps = {
    children: [],
    animation: 'slide',
    autoPlay: true,
    arrowType: 'always',
    defaultActiveIndex: numbers.DEFAULT_ACTIVE_INDEX,
    indicatorPosition: 'center',
    indicatorSize: 'small',
    indicatorType: 'dot',
    theme: 'light',
    showArrow: true,
    showIndicator: true,
    slideDirection: 'left',
    speed: numbers.DEFAULT_SPEED,
    trigger: 'click',
} satisfies Partial<CarouselProps>;

function getSlides(children: React.ReactNode) {
    return flattenChildren(children).filter((child) => isValidElement(child)) as React.ReactElement<any>[];
}

export default function Carousel(rawProps: CarouselProps) {
    const props = useDefaultProps('Carousel', rawProps, defaultProps);
    const { ref, activeIndex: activeIndexProp, animation, arrowProps, autoPlay, arrowType, children, className, defaultActiveIndex, indicatorPosition, indicatorSize, theme, indicatorType, onChange, showArrow, showIndicator, slideDirection, speed, style, trigger, ...rest } = props;

    const { direction } = useConfigContext();
    const { locale } = useLocale('Carousel');

    const baseId = useId();
    const tablistRef = useRef<HTMLDivElement>(null);
    const focusPending = useRef(false);

    const [foundation, state] = useFoundation<CarouselFoundation<CarouselProps, CarouselState>, CarouselAdapter<CarouselProps, CarouselState>, CarouselProps, CarouselState>(
        CarouselFoundation,
        props,
        () => {
            const activeIndex = CarouselFoundation.getDefaultActiveIndex(props);
            return { activeIndex, preIndex: activeIndex, isReverse: false, isInit: true, rotating: false };
        },
        (base) => ({
            notifyChange: (activeIndex, preIndex) => base.getProps().onChange?.(activeIndex, preIndex),
            setNewActiveIndex: (activeIndex) => base.setState({ activeIndex }),
            setPreActiveIndex: (preIndex) => base.setState({ preIndex }),
            setIsReverse: (isReverse) => base.setState({ isReverse }),
            setIsInit: (isInit) => base.setState({ isInit }),
            setRotating: (rotating) => base.setState({ rotating }),
            getSlideCount: () => getSlides(base.getProps().children).length,
        }),
        { direction }
    );

    const slides = getSlides(children);
    const total = slides.length;
    const hasIndicator = showIndicator && total > 1;
    const activeIndex = CarouselFoundation.deriveActiveIndex(props, state, total);
    const { preIndex, isInit, isReverse, rotating } = state;

    const animateStyle = {
        transitionTimingFunction: 'ease',
        transitionDuration: `${speed}ms`,
        animationTimingFunction: 'ease',
        animationDuration: `${speed}ms`,
    };

    const getTabId = (index: number) => `${baseId}-tab-${index}`;

    const getSlideId = (index: number): string => slides[index].props.id ?? `${baseId}-slide-${index}`;

    useDidUpdate(props.activeIndex, foundation.syncActiveIndex);

    // a boolean, since autoPlay is often a fresh object literal on every render
    useDidUpdate(CarouselFoundation.isAutoPlayOn(props.autoPlay), foundation.handleAutoPlayChange);
    useDidUpdate(total, (count, previous) => foundation.handleSlideCountChange(previous, count));

    useEffect(() => {
        if (focusPending.current) {
            focusPending.current = false;
            tablistRef.current?.querySelector<HTMLElement>('[role="tab"][tabindex="0"]')?.focus();
        }
    }, [activeIndex]);

    useImperativeHandle(
        props.ref,
        () => ({
            play: () => {
                foundation.setForcePlay(true);
                foundation.handleAutoPlay();
            },
            stop: () => {
                foundation.stopByUser();
            },
            goTo: foundation.goTo,
            prev: foundation.prev,
            next: foundation.next,
        }),
        [foundation]
    );

    return (
        <div
            // the name is the user's to give with aria-label or aria-labelledby
            aria-roledescription={locale.carousel}
            role="region"
            {...rest}
            className={clsx(className, cssClasses.CAROUSEL)}
            style={style}
            onBlur={(e) => {
                rest.onBlur?.(e);
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    foundation.handleFocusLeave();
                }
            }}
            onFocus={(e) => {
                rest.onFocus?.(e);
                // only keyboard focus pauses: a mouse click on an arrow focuses it too
                if (e.target.matches(':focus-visible')) {
                    foundation.handleKeyboardFocus();
                }
            }}
            onMouseEnter={(e) => {
                rest.onMouseEnter?.(e);
                foundation.handlePointerEnter();
            }}
            onMouseLeave={(e) => {
                rest.onMouseLeave?.(e);
                foundation.handlePointerLeave();
            }}
        >
            <div
                className={clsx(`${cssClasses.CAROUSEL_CONTENT}-${animation}`, cssClasses.CAROUSEL_CONTENT, {
                    [`${cssClasses.CAROUSEL_CONTENT}-reverse`]: slideDirection === 'left' ? isReverse : !isReverse,
                })}
                // announce a slide the user switched to, never one that rotation brought
                aria-live={rotating ? 'off' : 'polite'}
                x-semi-prop="children"
            >
                {slides.map((child, index) => {
                    const isCurrent = index === activeIndex;
                    // APG carousel: with indicators the slides are the panels of their tabs, otherwise named groups
                    const a11yProps = hasIndicator
                        ? { id: getSlideId(index), role: 'tabpanel', 'aria-labelledby': getTabId(index) }
                        : {
                              role: 'group',
                              'aria-roledescription': locale.slide,
                              'aria-label': child.props['aria-label'] ?? locale.slideN.replace('${index}', String(index + 1)),
                          };
                    return cloneElement(child, {
                        ...a11yProps,
                        // hidden slides are only transparent or invisible, so take them out of focus and the a11y tree
                        inert: !isCurrent,
                        style: { ...child.props.style, ...animateStyle },
                        className: clsx(child.props.className, {
                            [`${cssClasses.CAROUSEL_CONTENT}-item-prev`]: index === (activeIndex - 1 + total) % total,
                            [`${cssClasses.CAROUSEL_CONTENT}-item-next`]: index === (activeIndex + 1 + total) % total,
                            [`${cssClasses.CAROUSEL_CONTENT}-item-current`]: isCurrent,
                            [`${cssClasses.CAROUSEL_CONTENT}-item`]: true,
                            [`${cssClasses.CAROUSEL_CONTENT}-item-active`]: isCurrent,
                            [`${cssClasses.CAROUSEL_CONTENT}-item-slide-in`]: animation === 'slide' && !isInit && isCurrent,
                            [`${cssClasses.CAROUSEL_CONTENT}-item-slide-out`]: animation === 'slide' && !isInit && index === preIndex,
                        }),
                    });
                })}
            </div>
            {hasIndicator && (
                <div className={cssClasses.CAROUSEL_INDICATOR}>
                    <CarouselIndicator
                        ref={tablistRef}
                        type={indicatorType}
                        activeIndex={activeIndex}
                        getSlideId={getSlideId}
                        getTabId={getTabId}
                        position={indicatorPosition}
                        size={indicatorSize}
                        theme={theme}
                        total={total}
                        trigger={trigger}
                        onBlur={() => {
                            focusPending.current = false;
                        }}
                        onIndicatorChange={foundation.onIndicatorChange}
                        onKeyDown={(e) => {
                            if (foundation.handleKeyDown(e)) {
                                focusPending.current = true;
                            }
                        }}
                    />
                </div>
            )}
            {showArrow && total > 1 && <CarouselArrow type={arrowType} arrowProps={arrowProps} next={foundation.next} prev={foundation.prev} theme={theme} />}
        </div>
    );
}
