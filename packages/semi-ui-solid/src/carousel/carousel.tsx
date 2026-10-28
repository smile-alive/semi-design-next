import { Show, children, createEffect, createMemo, createRenderEffect, createUniqueId, on, splitProps } from 'solid-js';
import { isServer } from 'solid-js/web';
import clsx from 'clsx';
import { cssClasses, numbers } from '@fibrae/semi-foundation/carousel/constants';
import CarouselFoundation, { type CarouselAdapter } from '@fibrae/semi-foundation/carousel/foundation';
import '@fibrae/semi-foundation/carousel/carousel.scss';
import callHandler from '../_base/call-handler';
import isMarkup from '../_base/is-markup';
import mergeRefs from '../_base/merge-refs';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';
import useConfig from '../config-provider/use-config';
import useLocale from '../locale/use-locale';
import CarouselArrow from './carousel-arrow';
import CarouselIndicator from './carousel-indicator';
import type { CarouselHandle, CarouselProps } from './interface';
import { originalAttr, registerSlide, writeSlideAttrs } from './slide-attrs';

export interface CarouselState {
    activeIndex: number;
    preIndex: number;
    isReverse: boolean;
    isInit: boolean;
    rotating: boolean;
}

type Foundation = CarouselFoundation<CarouselProps, CarouselState>;
type Adapter = CarouselAdapter<CarouselProps, CarouselState>;

const defaultProps = {
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

const content = cssClasses.CAROUSEL_CONTENT;

export default function Carousel(rawProps: CarouselProps) {
    const props = useDefaultProps('Carousel', rawProps, defaultProps);

    const [local, rest] = splitProps(props, [
        'ref',
        'activeIndex',
        'animation',
        'arrowProps',
        'autoPlay',
        'arrowType',
        'children',
        'class',
        'defaultActiveIndex',
        'indicatorPosition',
        'indicatorSize',
        'theme',
        'indicatorType',
        'leftArrow',
        'onChange',
        'rightArrow',
        'showArrow',
        'showIndicator',
        'slideDirection',
        'speed',
        'trigger',
        'onFocusIn',
        'onFocusOut',
        'onMouseEnter',
        'onMouseLeave',
    ]);

    const config = useConfig();
    const locale = useLocale('Carousel');

    const baseId = createUniqueId();
    let tablist: HTMLDivElement | undefined;
    let focusPending = false;

    // Slides are the consumer's own elements: Carousel decorates them in place, as it cannot clone a Solid element
    const resolved = children(() => local.children);

    // On the server a slide is a markup string that cannot be decorated: it renders as given and gains its classes and
    // attributes at hydration (registered in component-issues)
    const slides = createMemo(() => {
        const elements = resolved.toArray().filter((node) => (isServer ? isMarkup(node) : node instanceof HTMLElement)) as HTMLElement[];
        if (!isServer) {
            elements.forEach(registerSlide);
        }
        return elements;
    });

    const total = () => slides().length;

    const { foundation, state } = useFoundation<Foundation, Adapter, CarouselProps, CarouselState>(
        CarouselFoundation,
        props,
        (view) => {
            const activeIndex = CarouselFoundation.getDefaultActiveIndex(view) as number;
            return { activeIndex, preIndex: activeIndex, isReverse: false, isInit: true, rotating: false };
        },
        (base) => ({
            notifyChange: (activeIndex, preIndex) => base.getProps().onChange?.(activeIndex, preIndex),
            setNewActiveIndex: (activeIndex) => base.setState({ activeIndex }),
            setPreActiveIndex: (preIndex) => base.setState({ preIndex }),
            setIsReverse: (isReverse) => base.setState({ isReverse }),
            setIsInit: (isInit) => base.setState({ isInit }),
            setRotating: (rotating) => base.setState({ rotating }),
            getSlideCount: () => total(),
        }),
        { context: () => ({ direction: config().direction }) }
    );

    const activeIndex = createMemo(() => CarouselFoundation.deriveActiveIndex(props, state(), total()));

    const handle: CarouselHandle = {
        play: () => {
            foundation.setForcePlay(true);
            foundation.handleAutoPlay();
        },
        stop: () => foundation.stopByUser(),
        goTo: (targetIndex) => foundation.goTo(targetIndex),
        prev: () => foundation.prev(),
        next: () => foundation.next(),
    };

    const hasIndicator = () => local.showIndicator && total() > 1;

    const getTabId = (index: number) => `${baseId}-tab-${index}`;

    // a slide keeps an id of its own, so links to it still work
    const getSlideId = (index: number) => {
        const slide = slides()[index];
        return (slide && originalAttr(slide, 'id')) || `${baseId}-slide-${index}`;
    };

    const handleFocusIn = (event: FocusEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onFocusIn, event);
        // only keyboard focus pauses: a mouse click on an arrow focuses it too
        if (event.target.matches(':focus-visible')) {
            foundation.handleKeyboardFocus();
        }
    };

    const handleFocusOut = (event: FocusEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onFocusOut, event);
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            foundation.handleFocusLeave();
        }
    };

    const handleMouseEnter = (event: MouseEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onMouseEnter, event);
        foundation.handlePointerEnter();
    };

    const handleMouseLeave = (event: MouseEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onMouseLeave, event);
        foundation.handlePointerLeave();
    };

    // Written before the DOM is inserted, so the first paint already has the classes
    createRenderEffect(() => {
        if (isServer) {
            return;
        }
        const list = slides();
        const count = list.length;
        const current = activeIndex();
        const { isInit, preIndex } = state();
        const indicator = hasIndicator();
        const { slide, slideN } = locale().locale;
        list.forEach((element, index) => {
            const isCurrent = index === current;
            // APG carousel: with indicators the slides are the panels of their tabs, otherwise named groups
            writeSlideAttrs(element, indicator ? { id: getSlideId(index), role: 'tabpanel', 'aria-labelledby': getTabId(index) } : { role: 'group', 'aria-roledescription': slide, 'aria-label': originalAttr(element, 'aria-label') ?? slideN.replace('${index}', String(index + 1)) });
            // hidden slides are only transparent or invisible, so take them out of focus and the a11y tree
            element.toggleAttribute('inert', !isCurrent);
            element.style.setProperty('transition-timing-function', 'ease');
            element.style.setProperty('transition-duration', `${local.speed}ms`);
            element.style.setProperty('animation-timing-function', 'ease');
            element.style.setProperty('animation-duration', `${local.speed}ms`);
            element.classList.toggle(`${content}-item-prev`, index === (current - 1 + count) % count);
            element.classList.toggle(`${content}-item-next`, index === (current + 1 + count) % count);
            element.classList.toggle(`${content}-item-current`, isCurrent);
            element.classList.add(`${content}-item`);
            element.classList.toggle(`${content}-item-active`, isCurrent);
            element.classList.toggle(`${content}-item-slide-in`, local.animation === 'slide' && !isInit && isCurrent);
            element.classList.toggle(`${content}-item-slide-out`, local.animation === 'slide' && !isInit && index === preIndex);
        });
    });

    useWatch(
        () => local.activeIndex,
        (value) => foundation.syncActiveIndex(value as number)
    );

    // a boolean, since autoPlay is often a fresh object literal on every update
    useWatch(
        () => CarouselFoundation.isAutoPlayOn(local.autoPlay),
        (autoPlayOn) => foundation.handleAutoPlayChange(autoPlayOn)
    );

    createEffect(
        on(total, (count, previous) => {
            // the first run has no previous count: the mount itself starts autoplay
            if (previous !== undefined) {
                foundation.handleSlideCountChange(previous, count);
            }
        })
    );

    // the roving tabindex moves with the current slide, so focus follows it after a key changed it
    createEffect(
        on(
            activeIndex,
            () => {
                if (focusPending) {
                    focusPending = false;
                    tablist?.querySelector<HTMLElement>('[role="tab"][tabindex="0"]')?.focus();
                }
            },
            { defer: true }
        )
    );

    return (
        <div
            // the name is the user's to give with aria-label or aria-labelledby
            aria-roledescription={locale().locale.carousel}
            role="region"
            {...rest}
            ref={(node) => mergeRefs(local.ref)(Object.assign(node, handle))}
            class={clsx(local.class, cssClasses.CAROUSEL)}
            onFocusIn={handleFocusIn}
            onFocusOut={handleFocusOut}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div
                class={clsx(`${content}-${local.animation}`, content, {
                    [`${content}-reverse`]: local.slideDirection === 'left' ? state().isReverse : !state().isReverse,
                })}
                // announce a slide the user switched to, never one that rotation brought
                aria-live={state().rotating ? 'off' : 'polite'}
                x-semi-prop="children"
            >
                {slides()}
            </div>
            <Show when={hasIndicator()}>
                <div class={cssClasses.CAROUSEL_INDICATOR}>
                    <CarouselIndicator
                        ref={(node) => (tablist = node)}
                        type={local.indicatorType}
                        activeIndex={activeIndex()}
                        getSlideId={getSlideId}
                        getTabId={getTabId}
                        position={local.indicatorPosition}
                        size={local.indicatorSize}
                        theme={local.theme}
                        total={total()}
                        trigger={local.trigger}
                        onBlur={() => {
                            focusPending = false;
                        }}
                        onIndicatorChange={(index) => foundation.onIndicatorChange(index)}
                        onKeyDown={(event) => {
                            // set first: the switch commits inside handleKeyDown, and the focus effect consumes the flag right then
                            focusPending = true;
                            if (!foundation.handleKeyDown(event)) {
                                focusPending = false;
                            }
                        }}
                    />
                </div>
            </Show>
            <Show when={local.showArrow && total() > 1}>
                <CarouselArrow type={local.arrowType} arrowProps={local.arrowProps} leftArrow={local.leftArrow} rightArrow={local.rightArrow} next={() => foundation.next()} prev={() => foundation.prev()} theme={local.theme} />
            </Show>
        </div>
    );
}
