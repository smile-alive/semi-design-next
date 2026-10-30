<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/divider/constants';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import '@fibrae/semi-foundation/divider/divider.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import type { DividerProps } from './interface.js';

    const defaults = useDefaultProps('Divider');
    let { layout = defaults('layout', 'horizontal'), align = defaults('align', 'center'), dashed = defaults('dashed'), margin = defaults('margin'), children, ...rest }: DividerProps = $props();

    const prefixCls = `${cssClasses.PREFIX}-divider`;

    // A snippet cannot be inspected, so passing children is what makes a horizontal divider carry text
    const withText = $derived(Boolean(children) && layout === 'horizontal');

    // The user's style goes last so it can override the margin
    const style = $derived.by(() => {
        const length = toCssLength(margin);
        const sides = length === undefined ? [] : layout === 'vertical' ? [`margin-left: ${length}`, `margin-right: ${length}`] : [`margin-top: ${length}`, `margin-bottom: ${length}`];
        return [...sides, rest.style].filter(Boolean).join('; ');
    });
</script>

<!-- a separator's children are presentational, so a divider with text has no role -->
<div
    {...rest}
    aria-orientation={rest['aria-orientation'] ?? (layout === 'vertical' ? 'vertical' : undefined)}
    class={[
        prefixCls,
        rest.class,
        {
            [`${prefixCls}-horizontal`]: layout === 'horizontal',
            [`${prefixCls}-vertical`]: layout === 'vertical',
            [`${prefixCls}-dashed`]: dashed,
            [`${prefixCls}-with-text`]: withText,
            [`${prefixCls}-with-text-${align}`]: withText,
        },
    ]}
    role={rest.role ?? (withText ? undefined : 'separator')}
    style={style || undefined}
>
    {#if withText}
        <span class={`${prefixCls}_inner-text`} x-semi-prop="children">{@render children?.()}</span>
    {/if}
</div>
