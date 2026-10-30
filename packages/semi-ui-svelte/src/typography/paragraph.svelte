<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/typography/constants';
    import TypographyBase from './base.svelte';
    import type { TypographyParagraphProps } from './interface.js';
    import type { TypographyBaseProps } from './internal.js';

    // A static subcomponent: it reads no global defaults, as in React.
    const props: TypographyParagraphProps = $props();
</script>

<!-- svelte/elements types event handlers per element, so HTMLAttributes<HTMLParagraphElement> is not assignable to HTMLAttributes<HTMLElement> -->
<TypographyBase {...props as TypographyBaseProps} class={[`${cssClasses.PREFIX}-paragraph`, props.class]} component={props.component ?? 'p'} />
