<script lang="ts">
    import { strings } from '@fibrae/semi-foundation/typography/constants';
    import TypographyBase from './base.svelte';
    import type { TypographyTitleProps } from './interface.js';
    import type { TypographyBaseProps } from './internal.js';

    // A static subcomponent: it reads no global defaults, as in React.
    const { heading = 1, ...props }: TypographyTitleProps = $props();

    const headingTag = $derived(strings.HEADING.includes(heading) ? (`h${heading}` as const) : 'h1');
</script>

<!-- svelte/elements types event handlers per element, so HTMLAttributes<HTMLHeadingElement> is not assignable to HTMLAttributes<HTMLElement> -->
<TypographyBase {...props as TypographyBaseProps} component={props.component ?? headingTag} {headingTag} />
