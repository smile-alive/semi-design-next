<script lang="ts">
    import { cssClasses, strings } from '@fibrae/semi-foundation/space/constants';
    import '@fibrae/semi-foundation/space/space.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import type { SpaceProps, Spacing } from './interface.js';

    const defaults = useDefaultProps('Space');
    let { wrap = defaults('wrap', false), align = defaults('align', 'center'), vertical = defaults('vertical', false), spacing = defaults('spacing', 'tight'), children, ...rest }: SpaceProps = $props();

    const prefixCls = cssClasses.PREFIX;
    const presets: string[] = [strings.SPACING_TIGHT, strings.SPACING_MEDIUM, strings.SPACING_LOOSE];

    // A preset becomes a class; a number becomes a gap in px
    const axes = $derived.by(() => {
        const [columns, rows]: Spacing[] = Array.isArray(spacing) ? spacing : [spacing, spacing];
        return {
            horizontal: typeof columns === 'string' ? columns : undefined,
            vertical: typeof rows === 'string' ? rows : undefined,
            gaps: [typeof columns === 'number' && `column-gap: ${columns}px`, typeof rows === 'number' && `row-gap: ${rows}px`],
        };
    });

    // The user's style goes last so its gaps beat a numeric spacing
    const style = $derived([...axes.gaps, rest.style].filter(Boolean).join('; '));
</script>

<div
    {...rest}
    class={[
        prefixCls,
        `${prefixCls}-align-${align}`,
        vertical ? `${prefixCls}-vertical` : `${prefixCls}-horizontal`,
        rest.class,
        {
            [`${prefixCls}-wrap`]: wrap && !vertical,
            [`${prefixCls}-${axes.horizontal}-horizontal`]: axes.horizontal && presets.includes(axes.horizontal),
            [`${prefixCls}-${axes.vertical}-vertical`]: axes.vertical && presets.includes(axes.vertical),
        },
    ]}
    {style}
    x-semi-prop="children"
>
    {@render children?.()}
</div>
