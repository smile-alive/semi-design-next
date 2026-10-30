<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/grid/constants';
    import { gutterStyle, normalizeGutter } from '@fibrae/semi-foundation/grid/gutter';
    import { getRowClassName } from '@fibrae/semi-foundation/grid/utils';
    import '@fibrae/semi-foundation/grid/grid.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import type { RowProps } from './interface.js';

    const defaults = useDefaultProps('Row');
    let { prefixCls = defaults('prefixCls', cssClasses.PREFIX), type = defaults('type'), align = defaults('align'), justify = defaults('justify'), gutter = defaults('gutter', 0), children, ...rest }: RowProps = $props();

    // The user's style goes last so it can override a gutter variable
    const style = $derived.by(() => {
        const [horizontal, vertical] = normalizeGutter(gutter);
        const vars = { ...gutterStyle('x', horizontal), ...gutterStyle('y', vertical) };
        return [...Object.entries(vars).map(([name, value]) => `${name}: ${value}`), rest.style].filter(Boolean).join('; ');
    });
</script>

<div {...rest} class={[getRowClassName(prefixCls, { type, justify, align }), rest.class]} {style} x-semi-prop="children">
    {@render children?.()}
</div>
