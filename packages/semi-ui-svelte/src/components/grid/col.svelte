<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/grid/constants';
    import { getColClassName, getColStyle } from '@fibrae/semi-foundation/components/grid/utils';
    import '@fibrae/semi-foundation/components/grid/grid.scss';
    import { useDefaultProps } from '../../base/index.js';
    import type { ColProps } from './interface.js';

    const defaults = useDefaultProps('Col');
    let { span = defaults('span'), order = defaults('order'), offset = defaults('offset'), push = defaults('push'), pull = defaults('pull'), xs = defaults('xs'), sm = defaults('sm'), md = defaults('md'), lg = defaults('lg'), xl = defaults('xl'), xxl = defaults('xxl'), children, ...rest }: ColProps = $props();

    const prefixCls = cssClasses.PREFIX;

    // The user's style goes last so it can override a layout variable
    const style = $derived.by(() => {
        const vars = getColStyle({ span, order, offset, push, pull, xs, sm, md, lg, xl, xxl });
        return [...Object.entries(vars).map(([name, value]) => `${name}: ${value}`), rest.style].filter(Boolean).join('; ');
    });
</script>

<div {...rest} class={[getColClassName(prefixCls), rest.class]} style={style || undefined} x-semi-prop="children">
    {@render children?.()}
</div>
