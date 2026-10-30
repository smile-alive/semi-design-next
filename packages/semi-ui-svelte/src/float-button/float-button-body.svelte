<script lang="ts">
    import type { Snippet } from 'svelte';
    import { cssClasses } from '@fibrae/semi-foundation/float-button/constants';
    import type { FloatButtonShape, FloatButtonSize } from './interface.js';

    let {
        colorful = false,
        disabled = false,
        shape,
        size,
        children,
    }: {
        colorful?: boolean;
        disabled?: boolean;
        shape?: FloatButtonShape;
        size?: FloatButtonSize;
        children?: Snippet;
    } = $props();

    const prefix = cssClasses.PREFIX;
</script>

<!-- A span, not a div: the body sits inside a native button or link, which only take phrasing content. -->
<span
    class={[
        `${prefix}-body`,
        {
            [`${prefix}-${shape}`]: shape,
            [`${prefix}-colorful`]: colorful,
            [`${prefix}-disabled`]: disabled,
            [`${prefix}-${size}`]: size,
        },
    ]}
>
    {@render children?.()}
</span>
