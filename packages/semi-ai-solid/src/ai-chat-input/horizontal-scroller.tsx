import { type JSX, Show, children, createEffect, createSignal, on } from 'solid-js';
import { numbers } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
import { IconChevronRightStroked } from '@fibrae/semi-icons-solid';
import { useFocusHandover, useLocale, useResizeObserver } from '@fibrae/semi-ui-solid/hooks';

export default function HorizontalScroller(props: { prefix: string; children: JSX.Element }) {
    const locale = useLocale('AIChatInput');

    let wrapper: HTMLDivElement | undefined;
    const [scrollContainer, setScrollContainer] = createSignal<HTMLDivElement>();
    const [canScrollLeft, setCanScrollLeft] = createSignal(false);
    const [canScrollRight, setCanScrollRight] = createSignal(false);

    // a button unmounts when its direction runs out; keyboard focus moves to the opposite one instead of the body
    const handoverFromLeft = useFocusHandover<HTMLButtonElement>(() => wrapper?.querySelector<HTMLElement>(`.${props.prefix}-scroll-button-right`));
    const handoverFromRight = useFocusHandover<HTMLButtonElement>(() => wrapper?.querySelector<HTMLElement>(`.${props.prefix}-scroll-button-left`));

    const resolved = children(() => props.children);

    const checkScrollAbility = () => {
        const container = scrollContainer();
        if (container) {
            const { scrollLeft, scrollWidth, clientWidth } = container;
            setCanScrollLeft(scrollLeft > 1);
            setCanScrollRight(Math.ceil(scrollLeft) < scrollWidth - clientWidth);
        }
    };

    const handleScroll = (scrollAmount: number) => {
        scrollContainer()?.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    };

    useResizeObserver(scrollContainer, checkScrollAbility);

    // new children can widen the content without resizing the container
    createEffect(on([resolved, scrollContainer], checkScrollAbility));

    return (
        <div ref={(element) => (wrapper = element)} class={`${props.prefix}-scroll-wrapper`}>
            <Show when={canScrollLeft()}>
                <button ref={handoverFromLeft} type="button" class={`${props.prefix}-scroll-button ${props.prefix}-scroll-button-left`} aria-label={locale().locale.scrollLeft} onClick={() => handleScroll(-numbers.SCROLL_AMOUNT)}>
                    <IconChevronRightStroked class={`${props.prefix}-scroll-button-left-icon`} />
                </button>
            </Show>
            <div ref={setScrollContainer} class={`${props.prefix}-scroll-container`} onScroll={checkScrollAbility}>
                {resolved()}
            </div>
            <Show when={canScrollRight()}>
                <button ref={handoverFromRight} type="button" class={`${props.prefix}-scroll-button ${props.prefix}-scroll-button-right`} aria-label={locale().locale.scrollRight} onClick={() => handleScroll(numbers.SCROLL_AMOUNT)}>
                    <IconChevronRightStroked />
                </button>
            </Show>
        </div>
    );
}
