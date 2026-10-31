import { For, Show, children, createEffect, createMemo, createUniqueId, on, splitProps } from 'solid-js';
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

    const resolved = children(() => local.children);

    // Only elements are slides; each is rendered inside a wrapper Carousel owns, so the consumer's element keeps its own
    // class, role and aria attributes
    const slides = createMemo(() => resolved.toArray().filter((node) => (isServer ? isMarkup(node) : node instanceof HTMLElement)));

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
        stop: foundation.stopByUser,
        goTo: foundation.goTo,
        prev: foundation.prev,
        next: foundation.next,
    };

    const hasIndicator = () => local.showIndicator && total() > 1;

    const getTabId = (index: number) => `${baseId}-tab-${index}`;

    const getSlideId = (index: number) => `${baseId}-slide-${index}`;

    const handleFocusIn = (event: FocusEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onFocusIn, event);
        // only keyboard focus pauses: a mouse click on an arrow focuses it too
        if (event.target.matches(':focus-visible')) {
            foundation.handleKeyboardFocus();
        }
    };

    const handleFocusOut = (event: FocusEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onFocusOut, event);
        if (!(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))) {
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

    useWatch(
        () => local.activeIndex,
        (value) => foundation.syncActiveIndex(value as number)
    );

    // a boolean, since autoPlay is often a fresh object literal on every update
    useWatch(() => CarouselFoundation.isAutoPlayOn(local.autoPlay), foundation.handleAutoPlayChange);

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
                <For each={slides()}>
                    {(slide, index) => {
                        const isCurrent = () => index() === activeIndex();
                        return (
                            // with indicators the slides are the panels of their tabs (APG tabbed carousel), otherwise named groups
                            <div
                                aria-label={hasIndicator() ? undefined : locale().locale.slideN.replace('${index}', String(index() + 1))}
                                aria-labelledby={hasIndicator() ? getTabId(index()) : undefined}
                                aria-roledescription={hasIndicator() ? undefined : locale().locale.slide}
                                class={clsx(`${content}-item`, {
                                    [`${content}-item-prev`]: index() === (activeIndex() - 1 + total()) % total(),
                                    [`${content}-item-next`]: index() === (activeIndex() + 1 + total()) % total(),
                                    [`${content}-item-current`]: isCurrent(),
                                    [`${content}-item-active`]: isCurrent(),
                                    [`${content}-item-slide-in`]: local.animation === 'slide' && !state().isInit && isCurrent(),
                                    [`${content}-item-slide-out`]: local.animation === 'slide' && !state().isInit && index() === state().preIndex,
                                })}
                                id={hasIndicator() ? getSlideId(index()) : undefined}
                                // hidden slides are only transparent or invisible, so take them out of focus and the a11y tree
                                inert={!isCurrent()}
                                role={hasIndicator() ? 'tabpanel' : 'group'}
                                style={{
                                    'transition-timing-function': 'ease',
                                    'transition-duration': `${local.speed}ms`,
                                    'animation-timing-function': 'ease',
                                    'animation-duration': `${local.speed}ms`,
                                }}
                            >
                                {slide}
                            </div>
                        );
                    }}
                </For>
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
                        onIndicatorChange={foundation.onIndicatorChange}
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
                <CarouselArrow type={local.arrowType} arrowProps={local.arrowProps} leftArrow={local.leftArrow} rightArrow={local.rightArrow} next={foundation.next} prev={foundation.prev} theme={local.theme} />
            </Show>
        </div>
    );
}
