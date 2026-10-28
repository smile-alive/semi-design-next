import { useState, useRef, useEffect, useCallback } from 'react';
import { numbers } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
import { IconChevronRightStroked } from '@fibrae/semi-icons-react';
import { useFocusHandover, useLocale, useResizeObserver } from '@fibrae/semi-ui-react/hooks';

export default function HorizontalScroller({ children, prefix }) {
    const { locale } = useLocale('AIChatInput');

    const wrapperRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    // a button unmounts when its direction runs out; keyboard focus moves to the opposite one instead of the body
    const handoverFromLeft = useFocusHandover<HTMLButtonElement>(() => wrapperRef.current?.querySelector<HTMLElement>(`.${prefix}-scroll-button-right`));
    const handoverFromRight = useFocusHandover<HTMLButtonElement>(() => wrapperRef.current?.querySelector<HTMLElement>(`.${prefix}-scroll-button-left`));

    const checkScrollAbility = useCallback(() => {
        const container = scrollContainerRef.current;
        if (container) {
            const { scrollLeft, scrollWidth, clientWidth } = container;
            setCanScrollLeft(scrollLeft > 1);
            setCanScrollRight(Math.ceil(scrollLeft) < scrollWidth - clientWidth);
        }
    }, []);

    const handleScroll = (scrollAmount: number) => {
        scrollContainerRef.current?.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    };

    // Known limitation: the scroll step is fixed; expose it as a prop if callers need to tune it
    const handleScrollLeft = () => handleScroll(-numbers.SCROLL_AMOUNT);

    const handleScrollRight = () => handleScroll(numbers.SCROLL_AMOUNT);

    useResizeObserver(scrollContainerRef, checkScrollAbility);

    // new children can widen the content without resizing the container
    useEffect(() => checkScrollAbility(), [checkScrollAbility, children]);

    return (
        <div ref={wrapperRef} className={`${prefix}-scroll-wrapper`}>
            {canScrollLeft && (
                <button ref={handoverFromLeft} type="button" className={`${prefix}-scroll-button ${prefix}-scroll-button-left`} aria-label={locale.scrollLeft} onClick={handleScrollLeft}>
                    <IconChevronRightStroked className={`${prefix}-scroll-button-left-icon`} />
                </button>
            )}
            <div ref={scrollContainerRef} className={`${prefix}-scroll-container`} onScroll={checkScrollAbility}>
                {children}
            </div>
            {canScrollRight && (
                <button ref={handoverFromRight} type="button" className={`${prefix}-scroll-button ${prefix}-scroll-button-right`} aria-label={locale.scrollRight} onClick={handleScrollRight}>
                    <IconChevronRightStroked />
                </button>
            )}
        </div>
    );
}
