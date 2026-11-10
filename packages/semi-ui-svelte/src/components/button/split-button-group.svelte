<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/button/constants';
    import { markEnds } from '@fibrae/semi-foundation/components/button/utils';
    import '@fibrae/semi-foundation/components/button/button.scss';
    import observeMutations from '../../utils/observe-mutations.js';
    import type { SplitButtonGroupProps } from './interface.js';

    let { children, ...rest }: SplitButtonGroupProps = $props();

    const prefix = cssClasses.PREFIX;

    // A re-render can replace a button's class, so mark again whenever classes or buttons change.
    const trackEnds = observeMutations((node: HTMLDivElement) => markEnds(node), { attributeFilter: ['class'], childList: true, subtree: true });
</script>

<div {...rest} {@attach trackEnds} class={[`${prefix}-split`, rest.class]} role="group">
    {@render children?.()}
</div>
