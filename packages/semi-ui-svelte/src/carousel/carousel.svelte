<script lang="ts" generics="T">
    import { onMount } from 'svelte';
    import { cssClasses, numbers } from '@fibrae/semi-foundation/components/carousel/constants';
    import CarouselFoundation, { type CarouselAdapter, type CarouselBaseProps, type CarouselState } from '@fibrae/semi-foundation/components/carousel/foundation';
    import { formatLocale } from '@fibrae/semi-foundation/locale/format';
    import '@fibrae/semi-foundation/components/carousel/carousel.scss';
    import { IconChevronLeft, IconChevronRight } from '@fibrae/semi-icons-svelte';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import { getConfigContext } from '../config-provider/context.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import type { CarouselProps } from './interface.js';

    type Foundation = CarouselFoundation<CarouselBaseProps>;
    type Adapter = CarouselAdapter<CarouselBaseProps>;

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
    let focusPending = false;

    // Slides that arrive after mount (data still loading) start the configured autoplay, as mounting with them would
    let renderedCount = 0;

    // Whether the custom arrow content names its button; Svelte cannot inspect a snippet, so the rendered DOM is read once
    let leftNamed = $state(false);
    let rightNamed = $state(false);

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
        (view) => CarouselFoundation.getInitialState(view),
        () => ({
            notifyChange: (next, preIndex) => {
                activeIndex = next;
                onChange?.(next, preIndex);
            },
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

    const slideNumber = (index: number) => formatLocale(locale().locale.slideN, { index: index + 1 });

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

    const handleFocusIn = (event: FocusEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        foundation.handleFocusIn(event);
        onfocusin?.(event);
    };

    const handleFocusOut = (event: FocusEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        foundation.handleFocusOut(event);
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
        foundation.play();
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
