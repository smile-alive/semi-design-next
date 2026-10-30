<script lang="ts" generics="T">
    import { onMount } from 'svelte';
    import { cssClasses, numbers } from '@fibrae/semi-foundation/carousel/constants';
    import CarouselFoundation, { type CarouselAdapter, type CarouselBaseProps } from '@fibrae/semi-foundation/carousel/foundation';
    import '@fibrae/semi-foundation/carousel/carousel.scss';
    import { IconChevronLeft, IconChevronRight } from '@fibrae/semi-icons-svelte';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import { getConfigContext } from '../config-provider/context.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import type { CarouselProps, CarouselState } from './interface.js';

    type Foundation = CarouselFoundation<CarouselBaseProps, CarouselState>;
    type Adapter = CarouselAdapter<CarouselBaseProps, CarouselState>;

    const defaults = useDefaultProps('Carousel');

    // No fallback on `activeIndex`: a bound `undefined` would throw with one
    let {
        activeIndex = $bindable(),
        animation = defaults('animation', 'slide'),
        arrowProps = defaults('arrowProps'),
        arrowType = defaults('arrowType', 'always'),
        autoPlay = defaults('autoPlay', true),
        indicatorPosition = defaults('indicatorPosition', 'center'),
        indicatorSize = defaults('indicatorSize', 'small'),
        indicatorType = defaults('indicatorType', 'dot'),
        items,
        showArrow = defaults('showArrow', true),
        showIndicator = defaults('showIndicator', true),
        slideDirection = defaults('slideDirection', 'left'),
        speed = defaults('speed', numbers.DEFAULT_SPEED),
        theme = defaults('theme', 'light'),
        trigger = defaults('trigger', 'click'),
        onChange,
        onfocusin,
        onfocusout,
        onmouseenter,
        onmouseleave,
        leftArrow,
        rightArrow,
        slide,
        ...rest
    }: CarouselProps<T> = $props();

    const config = getConfigContext();
    const locale = useLocale('Carousel');

    const uid = $props.id();

    // Used to find the indicator tab to focus, from the root: slides may contain tabs or nested carousels
    let root: HTMLElement | undefined;

    // the roving tabindex moves with the current slide, so focus follows it after a key changed it
    let focusPending = false;

    // Slides that arrive after mount (data still loading) start the configured autoplay, as mounting with them would
    let renderedCount = 0;

    // Whether the custom arrow content names its button; Svelte cannot inspect a snippet, so the rendered DOM is read once
    let leftNamed = $state(false);
    let rightNamed = $state(false);

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: CarouselBaseProps = {
        get activeIndex() {
            return activeIndex;
        },
        get autoPlay() {
            return autoPlay;
        },
        get speed() {
            return speed;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, CarouselBaseProps, CarouselState>(
        CarouselFoundation,
        foundationProps,
        (view) => {
            const initial = view.activeIndex ?? numbers.DEFAULT_ACTIVE_INDEX;
            return { activeIndex: initial, preIndex: initial, isReverse: false, isInit: true, rotating: false };
        },
        (base) => ({
            notifyChange: (next, preIndex) => {
                // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides locally
                activeIndex = next;
                onChange?.(next, preIndex);
            },
            setNewActiveIndex: (next) => base.setState({ activeIndex: next }),
            setPreActiveIndex: (preIndex) => base.setState({ preIndex }),
            setIsReverse: (isReverse) => base.setState({ isReverse }),
            setIsInit: (isInit) => base.setState({ isInit }),
            setRotating: (rotating) => base.setState({ rotating }),
            getSlideCount: () => items.length,
        }),
        { context: () => config }
    );

    const total = $derived(items.length);
    const current = $derived(CarouselFoundation.deriveActiveIndex({ activeIndex }, states(), total));
    const hasIndicator = $derived(showIndicator && total > 1);
    const animateStyle = $derived(`transition-timing-function: ease; transition-duration: ${speed}ms; animation-timing-function: ease; animation-duration: ${speed}ms`);
    const leftProps = $derived(arrowProps?.leftArrow?.props ?? {});
    const rightProps = $derived(arrowProps?.rightArrow?.props ?? {});
    const content = cssClasses.CAROUSEL_CONTENT;
    const indicator = cssClasses.CAROUSEL_INDICATOR;
    const arrow = cssClasses.CAROUSEL_ARROW;

    const tabId = (index: number) => `${uid}-tab-${index}`;

    const slideId = (index: number) => `${uid}-slide-${index}`;

    const slideNumber = (index: number) => locale().locale.slideN.replace('${index}', String(index + 1));

    // arrowProps goes first so that its aria-label wins; custom content with readable text names the button itself
    const arrowLabel = (props: { 'aria-label'?: string | null }, custom: boolean, named: boolean, fallback: string) => props['aria-label'] ?? (custom && named ? undefined : fallback);

    const hasReadableText = (node: Element) => (node.textContent ?? '').trim() !== '' || node.querySelector('[aria-label]') !== null;

    const handleMouseEnter = (event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        foundation.handlePointerEnter();
        onmouseenter?.(event);
    };

    const handleMouseLeave = (event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        foundation.handlePointerLeave();
        onmouseleave?.(event);
    };

    // Only keyboard focus pauses: a mouse click on an arrow focuses it too.
    const handleFocusIn = (event: FocusEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        if (event.target instanceof Element && event.target.matches(':focus-visible')) {
            foundation.handleKeyboardFocus();
        }
        onfocusin?.(event);
    };

    const handleFocusOut = (event: FocusEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        if (!(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))) {
            foundation.handleFocusLeave();
        }
        onfocusout?.(event);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (foundation.handleKeyDown(event)) {
            focusPending = true;
        }
    };

    const handleTabBlur = () => {
        focusPending = false;
    };

    const handleTabClick = (index: number) => {
        if (trigger === 'click') {
            foundation.onIndicatorChange(index);
        }
    };

    const handleTabEnter = (index: number) => {
        if (trigger === 'hover') {
            foundation.onIndicatorChange(index);
        }
    };

    const handlePrev = (event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => {
        leftProps.onclick?.(event);
        foundation.prev();
    };

    const handleNext = (event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => {
        rightProps.onclick?.(event);
        foundation.next();
    };

    watch(
        () => activeIndex,
        (value) => foundation.syncActiveIndex(value as number)
    );

    // a boolean, since autoPlay is often a fresh object literal on every render
    watch(() => CarouselFoundation.isAutoPlayOn(autoPlay), foundation.handleAutoPlayChange);

    watch(
        () => items.length,
        (count) => {
            const previous = renderedCount;
            renderedCount = count;
            foundation.handleSlideCountChange(previous, count);
        }
    );

    watch(
        () => current,
        () => {
            if (focusPending) {
                focusPending = false;
                root?.querySelector<HTMLElement>(`:scope > .${indicator} [role="tab"][tabindex="0"]`)?.focus();
            }
        }
    );

    onMount(() => {
        renderedCount = items.length;
    });

    export function play() {
        foundation.setForcePlay(true);
        foundation.handleAutoPlay();
    }

    export function stop() {
        foundation.stopByUser();
    }

    export function goTo(targetIndex: number) {
        foundation.goTo(targetIndex);
    }

    export function prev() {
        foundation.prev();
    }

    export function next() {
        foundation.next();
    }
</script>

<div {...rest} aria-roledescription={rest['aria-roledescription'] ?? locale().locale.carousel} bind:this={root} class={[cssClasses.CAROUSEL, rest.class]} role={rest.role ?? 'region'} onfocusin={handleFocusIn} onfocusout={handleFocusOut} onmouseenter={handleMouseEnter} onmouseleave={handleMouseLeave}>
    <!-- announce a slide the user switched to, never one that rotation brought -->
    <div aria-live={states().rotating ? 'off' : 'polite'} class={[`${content}-${animation}`, content, { [`${content}-reverse`]: slideDirection === 'left' ? states().isReverse : !states().isReverse }]} x-semi-prop="slide">
        {#each items as item, index (index)}
            {@const isCurrent = index === current}
            <!-- with indicators the slides are the panels of their tabs (APG tabbed carousel), otherwise named groups -->
            <div
                aria-label={hasIndicator ? undefined : slideNumber(index)}
                aria-labelledby={hasIndicator ? tabId(index) : undefined}
                aria-roledescription={hasIndicator ? undefined : locale().locale.slide}
                class={[
                    content + '-item',
                    {
                        [`${content}-item-prev`]: index === (current - 1 + total) % total,
                        [`${content}-item-next`]: index === (current + 1 + total) % total,
                        [`${content}-item-current`]: isCurrent,
                        [`${content}-item-active`]: isCurrent,
                        [`${content}-item-slide-in`]: animation === 'slide' && !states().isInit && isCurrent,
                        [`${content}-item-slide-out`]: animation === 'slide' && !states().isInit && index === states().preIndex,
                    },
                ]}
                id={hasIndicator ? slideId(index) : undefined}
                inert={!isCurrent}
                role={hasIndicator ? 'tabpanel' : 'group'}
                style={animateStyle}
            >
                {@render slide({ item, index })}
            </div>
        {/each}
    </div>
    {#if hasIndicator}
        <div class={indicator}>
            <div aria-label={locale().locale.indicators} class={[indicator, `${indicator}-${indicatorType}`, `${indicator}-${indicatorPosition}`]} role="tablist">
                {#each items as _, index (index)}
                    {@const isCurrent = index === current}
                    <button
                        aria-controls={slideId(index)}
                        aria-label={slideNumber(index)}
                        aria-selected={isCurrent}
                        class={[`${indicator}-item`, { [`${indicator}-item-active`]: isCurrent, [`${indicator}-item-${theme}`]: theme, [`${indicator}-item-${indicatorSize}`]: indicatorSize }]}
                        data-index={index}
                        id={tabId(index)}
                        role="tab"
                        tabindex={isCurrent ? 0 : -1}
                        type="button"
                        onblur={handleTabBlur}
                        onclick={() => handleTabClick(index)}
                        onkeydown={handleKeyDown}
                        onmouseenter={() => handleTabEnter(index)}
                    ></button>
                {/each}
            </div>
        </div>
    {/if}
    {#if showArrow && total > 1}
        <div class={[arrow, `${arrow}-${theme}`, { [`${arrow}-hover`]: arrowType === 'hover' }]}>
            <button
                {...leftProps}
                {@attach (node) => {
                    leftNamed = hasReadableText(node);
                }}
                aria-label={arrowLabel(leftProps, Boolean(leftArrow), leftNamed, locale().locale.prev)}
                class={[`${arrow}-prev`, `${arrow}-${theme}`, leftProps.class]}
                type="button"
                x-semi-prop="leftArrow"
                onclick={handlePrev}
            >
                {#if leftArrow}
                    {@render leftArrow()}
                {:else}
                    <IconChevronLeft size="inherit" />
                {/if}
            </button>
            <button
                {...rightProps}
                {@attach (node) => {
                    rightNamed = hasReadableText(node);
                }}
                aria-label={arrowLabel(rightProps, Boolean(rightArrow), rightNamed, locale().locale.next)}
                class={[`${arrow}-next`, `${arrow}-${theme}`, rightProps.class]}
                type="button"
                x-semi-prop="rightArrow"
                onclick={handleNext}
            >
                {#if rightArrow}
                    {@render rightArrow()}
                {:else}
                    <IconChevronRight size="inherit" />
                {/if}
            </button>
        </div>
    {/if}
</div>
