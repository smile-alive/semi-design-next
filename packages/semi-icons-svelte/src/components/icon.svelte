<script lang="ts" module>
    import type { Snippet } from 'svelte';
    import type { HTMLAttributes } from 'svelte/elements';

    export type IconSize = 'inherit' | 'extra-small' | 'small' | 'default' | 'large' | 'extra-large';

    export interface IconProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
        size?: IconSize;
        spin?: boolean;
        rotate?: number;
        prefixCls?: string;
        type?: string;
        fill?: string | string[];
        /** Receives the `fill` prop, so a custom svg can apply it */
        children?: Snippet<[{ fill?: string | string[] }]>;
    }
</script>

<script lang="ts">
    import { BASE_CLASS_PREFIX } from '../env.js';
    import '@fibrae/semi-icons-core/styles/icons.scss';

    let { size = 'default', spin = false, rotate, prefixCls = BASE_CLASS_PREFIX, type, fill, children, ...rest }: IconProps = $props();

    const prefix = $derived(`${prefixCls}-icon`);
    // An icon with a name or in the tab order is content; otherwise it is decoration
    const exposed = $derived(Boolean(rest['aria-label'] || rest['aria-labelledby']) || Number(rest.tabindex) >= 0);
    // The user's style comes last so it can override the rotation
    const style = $derived([Number.isSafeInteger(rotate) ? `transform: rotate(${rotate}deg)` : undefined, rest.style].filter(Boolean).join(';') || undefined);
</script>

<span
    {...rest}
    aria-hidden={exposed ? undefined : true}
    class={[
        prefix,
        {
            [`${prefix}-${size}`]: size !== 'inherit',
            [`${prefix}-spinning`]: spin,
            [`${prefix}-${type}`]: type,
        },
        rest.class,
    ]}
    role={exposed ? 'img' : undefined}
    {style}
>
    {@render children?.({ fill })}
</span>
