<script lang="ts">
    import type { Attachment } from 'svelte/attachments';
    import { cssClasses } from '@fibrae/semi-foundation/button/constants';
    import { markEnds } from '@fibrae/semi-foundation/button/utils';
    import '@fibrae/semi-foundation/button/button.scss';
    import type { SplitButtonGroupProps } from './interface.js';

    let { children, ...rest }: SplitButtonGroupProps = $props();

    const prefix = cssClasses.PREFIX;

    // A re-render can replace a button's class, so mark again whenever classes or buttons change.
    const trackEnds: Attachment<HTMLDivElement> = (node) => {
        markEnds(node);
        const observer = new MutationObserver((mutations) => {
            if (mutations.some((mutation) => mutation.type === 'childList' || (mutation.type === 'attributes' && mutation.attributeName === 'class'))) {
                markEnds(node);
            }
        });
        observer.observe(node, { attributes: true, childList: true, subtree: true });
        return () => observer.disconnect();
    };
</script>

<div {...rest} {@attach trackEnds} class={[`${prefix}-split`, rest.class]} role="group">
    {@render children?.()}
</div>
