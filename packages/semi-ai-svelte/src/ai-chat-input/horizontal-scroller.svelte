<script lang="ts">
    import { type Snippet, tick } from 'svelte';
    import type { Attachment } from 'svelte/attachments';
    import { cssClasses, numbers } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import { handoverFocus } from '@fibrae/semi-foundation/utils/focus-handover';
    import { IconChevronRightStroked } from '@fibrae/semi-icons-svelte';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';

    let { children }: { children?: Snippet } = $props();

    const locale = useLocale('AIChatInput');

    let wrapper = $state<HTMLDivElement>();
    let container = $state<HTMLDivElement>();
    let canScrollLeft = $state(false);
    let canScrollRight = $state(false);

    const prefix = cssClasses.PREFIX;

    // A button unmounts when its direction runs out; the one that still shows takes the focus instead of the body
    const check = async () => {
        if (!container) {
            return;
        }
        const { scrollLeft, scrollWidth, clientWidth } = container;
        const left = scrollLeft > 1;
        const right = Math.ceil(scrollLeft) < scrollWidth - clientWidth;
        if (left === canScrollLeft && right === canScrollRight) {
            return;
        }
        const active = wrapper && FocusTrapHandle.getActiveElement(wrapper);
        const focused = active && wrapper?.contains(active) && active.classList.contains(`${prefix}-scroll-button`) ? active : undefined;
        canScrollLeft = left;
        canScrollRight = right;
        if (focused) {
            await tick();
            handoverFocus(focused, wrapper?.querySelector<HTMLElement>(`.${prefix}-scroll-button`));
        }
    };

    // Known limitation: the scroll step is fixed; expose it as a prop if callers need to tune it
    const scroll = (amount: number) => container?.scrollBy({ left: amount, behavior: 'smooth' });

    // new children can widen the content without resizing the container
    const track: Attachment<HTMLDivElement> = (element) => {
        container = element;
        void check();
        const resize = new ResizeObserver(() => void check());
        resize.observe(element);
        const mutation = new MutationObserver(() => void check());
        mutation.observe(element, { childList: true, subtree: true });
        return () => {
            resize.disconnect();
            mutation.disconnect();
        };
    };
</script>

<div bind:this={wrapper} class={`${prefix}-scroll-wrapper`}>
    {#if canScrollLeft}
        <button aria-label={locale().locale.scrollLeft} class={[`${prefix}-scroll-button`, `${prefix}-scroll-button-left`]} type="button" onclick={() => scroll(-numbers.SCROLL_AMOUNT)}>
            <IconChevronRightStroked class={`${prefix}-scroll-button-left-icon`} />
        </button>
    {/if}
    <div {@attach track} class={`${prefix}-scroll-container`} onscroll={() => void check()}>
        {@render children?.()}
    </div>
    {#if canScrollRight}
        <button aria-label={locale().locale.scrollRight} class={[`${prefix}-scroll-button`, `${prefix}-scroll-button-right`]} type="button" onclick={() => scroll(numbers.SCROLL_AMOUNT)}>
            <IconChevronRightStroked />
        </button>
    {/if}
</div>
